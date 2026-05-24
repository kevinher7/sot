import type {
  RecordAction,
  RecordActionResult,
  RecorderFormData,
} from "@/entrypoints/content/runtime/recorder/types";

const RECORDER_URL =
  "https://s2.ta.kingoftime.jp/independent/recorder2/personal/";

const ACTION_BUTTON_SELECTORS: Record<RecordAction, string> = {
  "clock-in": ".record-clock-in",
  "break-start": ".record-rest-start",
  "break-end": ".record-rest-end",
  "clock-out": ".record-clock-out",
};

let pendingAction: RecordAction | null = null;

export function getPendingAction(): RecordAction | null {
  return pendingAction;
}

function parseRecorderPage(html: string): RecorderFormData | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const form = doc.querySelector<HTMLFormElement>("form");

  if (form === null) {
    return null;
  }

  const actionUrl = form.action || RECORDER_URL;
  const hiddenFields: Record<string, string> = {};

  form
    .querySelectorAll<HTMLInputElement>('input[type="hidden"]')
    .forEach((input) => {
      if (input.name) {
        hiddenFields[input.name] = input.value;
      }
    });

  const csrfToken = hiddenFields["_token"] ?? hiddenFields["token"] ?? "";

  return { actionUrl, csrfToken, hiddenFields };
}

function findButtonIdentifier(
  html: string,
  action: RecordAction,
): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const selector = ACTION_BUTTON_SELECTORS[action];
  const button = doc.querySelector<HTMLElement>(selector);

  if (button !== null) {
    return button.id || button.getAttribute("data-id") || null;
  }

  const allButtons = doc.querySelectorAll<HTMLElement>(
    '[class*="record-btn-outer"], [class*="record-clock"], [class*="record-rest"]',
  );

  const actionKeywords: Record<RecordAction, string[]> = {
    "clock-in": ["clock_in", "clock-in", "出勤", "timerecorder_clock_in"],
    "break-start": [
      "rest_start",
      "rest-start",
      "休始",
      "timerecorder_rest_start",
    ],
    "break-end": ["rest_end", "rest-end", "休終", "timerecorder_rest_end"],
    "clock-out": ["clock_out", "clock-out", "退勤", "timerecorder_clock_out"],
  };

  const keywords = actionKeywords[action];

  for (const btn of allButtons) {
    const id = btn.id || "";
    const text = btn.textContent || "";
    const classes = btn.className || "";
    const combined = `${id} ${text} ${classes}`.toLowerCase();

    if (keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      return id || null;
    }
  }

  return null;
}

export async function submitRecordAction(
  action: RecordAction,
): Promise<RecordActionResult> {
  pendingAction = action;

  try {
    const response = await fetch(RECORDER_URL, {
      credentials: "include",
      method: "GET",
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `Recorder page fetch failed: ${response.status}`,
      };
    }

    const html = await response.text();
    const formData = parseRecorderPage(html);

    if (formData === null) {
      return { ok: false, reason: "Could not parse recorder form" };
    }

    const buttonId = findButtonIdentifier(html, action);

    const body = new URLSearchParams();

    Object.entries(formData.hiddenFields).forEach(([key, value]) => {
      body.set(key, value);
    });

    if (buttonId !== null) {
      body.set("id", buttonId);
    }

    body.set("action", action);

    const postResponse = await fetch(formData.actionUrl, {
      body,
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    if (!postResponse.ok) {
      return {
        ok: false,
        reason: `Record action failed: ${postResponse.status}`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    pendingAction = null;
  }
}
