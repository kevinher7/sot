import { getNow } from "@/platform/time/clock";
import type {
  RecorderButton,
  RecorderSettings,
  RecordAction,
  RecordActionResult,
} from "@/entrypoints/content/runtime/recorder/types";

const GATEWAY_URL = "https://s2.ta.kingoftime.jp/gateway/bprgateway";

const SETTINGS_STORAGE_KEY = "PARSONAL_BROWSER_RECORDER@SETTING";
const BROWSER_ID_STORAGE_KEY = "PARSONAL_BROWSER_RECORDER@BROWSER_ID";

const ACTION_BUTTON_NAMES: Record<RecordAction, string> = {
  "clock-in": "出勤",
  "break-start": "休始",
  "break-end": "休終",
  "clock-out": "退勤",
};

let pendingAction: RecordAction | null = null;

export function getPendingAction(): RecordAction | null {
  return pendingAction;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecorderSettings(): RecorderSettings | null {
  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (raw === null) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;

  const userToken =
    isRecord(parsed["user"]) && typeof parsed["user"]["user_token"] === "string"
      ? parsed["user"]["user_token"]
      : null;

  const token =
    isRecord(parsed["token"]) && typeof parsed["token"]["token_b"] === "string"
      ? parsed["token"]["token_b"]
      : null;

  if (userToken === null || token === null) return null;

  const timerecorder = parsed["timerecorder"];

  if (!isRecord(timerecorder)) return null;

  const rawButtons = timerecorder["record_button"];

  if (!Array.isArray(rawButtons)) return null;

  const buttons: RecorderButton[] = [];

  for (const b of rawButtons) {
    if (
      !isRecord(b) ||
      typeof b["name"] !== "string" ||
      typeof b["id"] !== "string" ||
      typeof b["color"] !== "string"
    ) {
      return null;
    }
    buttons.push({
      name: b["name"],
      id: b["id"],
      color: b["color"],
      mark: typeof b["mark"] === "string" ? b["mark"] : "",
    });
  }

  return { userToken, token, buttons };
}

function readBrowserId(): string | null {
  return window.localStorage.getItem(BROWSER_ID_STORAGE_KEY);
}

function findButtonId(
  buttons: readonly RecorderButton[],
  action: RecordAction,
): string | null {
  const targetName = ACTION_BUTTON_NAMES[action];
  const match = buttons.find((b) => b.name === targetName);

  return match?.id ?? null;
}

function formatUniqueTimestamp(now: Date): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const mo = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const h = String(jst.getUTCHours()).padStart(2, "0");
  const mi = String(jst.getUTCMinutes()).padStart(2, "0");
  const s = String(jst.getUTCSeconds()).padStart(2, "0");

  return `${y}${mo}${d}${h}${mi}${s}`;
}

function buildGatewayPayload(
  buttonId: string,
  settings: RecorderSettings,
  browserId: string,
  now: Date,
): URLSearchParams {
  const body = new URLSearchParams();

  body.set("id", buttonId);
  body.set("user_token", settings.userToken);
  body.set("token", settings.token);
  body.set("browser_id", browserId);
  body.set("unique_timestamp", formatUniqueTimestamp(now));
  body.set("d_param", String(now.getTime()));
  body.set("credential_code", "40");
  body.set("highAccuracyFlg", "false");
  body.set("latitude", "");
  body.set("longitude", "");
  body.set("highAcPos", "");
  body.set("lowAcPos", "");
  body.set("record_image", "");
  body.set("timerecorder_id", "");

  return body;
}

export async function submitRecordAction(
  action: RecordAction,
): Promise<RecordActionResult> {
  pendingAction = action;

  try {
    const settings = readRecorderSettings();

    if (settings === null) {
      return {
        ok: false,
        reason: "Recorder settings not found in localStorage",
      };
    }

    const browserId = readBrowserId();

    if (browserId === null) {
      return { ok: false, reason: "Browser ID not found in localStorage" };
    }

    const buttonId = findButtonId(settings.buttons, action);

    if (buttonId === null) {
      return {
        ok: false,
        reason: `No button found for action: ${action}`,
      };
    }

    const now = getNow();
    const body = buildGatewayPayload(buttonId, settings, browserId, now);

    const response = await fetch(GATEWAY_URL, {
      body,
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `Gateway request failed: ${response.status}`,
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
