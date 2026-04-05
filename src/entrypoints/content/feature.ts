import { calculateMonthlyRequiredHours } from "../../domain/kot/monthly-required-hours";
import {
  ROOT_ID,
  ensureOverlayRoot,
  renderOverlayError,
  renderOverlayLoading,
  renderOverlayResult,
} from "./overlay";
import { readMonthlyWorkSchedule } from "./page-reader";

const SETTINGS_KEY = "settings";
const DEFAULT_STANDARD_WORKDAY_HOURS = 8;

type ContentFeatureSettings = {
  standardWorkdayHours: number;
};

async function getContentFeatureSettings(): Promise<ContentFeatureSettings> {
  const runtime = globalThis as typeof globalThis & {
    browser?: typeof browser;
    chrome?: typeof browser;
  };

  const api = runtime.browser ?? runtime.chrome;
  if (!api) {
    return {
      standardWorkdayHours: DEFAULT_STANDARD_WORKDAY_HOURS,
    };
  }

  const stored = (await api.storage.local.get({
    [SETTINGS_KEY]: {
      standardWorkdayHours: DEFAULT_STANDARD_WORKDAY_HOURS,
    },
  })) as {
    [SETTINGS_KEY]?: Partial<ContentFeatureSettings>;
  };

  return {
    standardWorkdayHours:
      stored[SETTINGS_KEY]?.standardWorkdayHours ??
      DEFAULT_STANDARD_WORKDAY_HOURS,
  };
}

function isOverlayMutationTarget(node: Node): boolean {
  if (node instanceof HTMLElement) {
    return node.id === ROOT_ID || node.closest(`#${ROOT_ID}`) !== null;
  }

  return node.parentElement?.closest(`#${ROOT_ID}`) !== null;
}

function observeDocumentChanges(
  doc: Document,
  onChange: () => void,
): MutationObserver | null {
  if (!doc.body) {
    return null;
  }

  const observer = new MutationObserver((records) => {
    const hasNonOverlayMutation = records.some(
      (record) => !isOverlayMutationTarget(record.target),
    );

    if (hasNonOverlayMutation) {
      onChange();
    }
  });

  observer.observe(doc.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  return observer;
}

export async function startMonthlyRequiredHoursFeature(
  win: Window = window,
  doc: Document = document,
): Promise<void> {
  const root = ensureOverlayRoot(doc);
  renderOverlayLoading(root, doc, "Loading monthly work schedule...");

  try {
    const settings = await getContentFeatureSettings();
    let lastSignature: string | null = null;
    let refreshScheduled = false;

    const refresh = () => {
      refreshScheduled = false;

      const snapshot = readMonthlyWorkSchedule(doc);
      if (!snapshot) {
        renderOverlayLoading(root, doc, "Waiting for monthly table...");
        lastSignature = null;
        return;
      }

      if (snapshot.signature === lastSignature) {
        return;
      }

      lastSignature = snapshot.signature;
      renderOverlayResult(
        root,
        doc,
        calculateMonthlyRequiredHours(
          snapshot.dayKinds,
          settings.standardWorkdayHours,
        ),
      );
    };

    const scheduleRefresh = () => {
      if (refreshScheduled) {
        return;
      }

      refreshScheduled = true;
      win.requestAnimationFrame(() => {
        refresh();
      });
    };

    observeDocumentChanges(doc, scheduleRefresh);
    refresh();
  } catch (error) {
    renderOverlayError(
      root,
      doc,
      error instanceof Error
        ? error.message
        : "Failed to calculate monthly required hours.",
    );
  }
}
