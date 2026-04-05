import { calculateOverlayMetrics } from "../../domain/kot/overlay-calculations";
import { getNow, getDelayUntilNextMinute } from "../../platform/time/clock";
import { getSettings } from "../../platform/webext/storage";
import {
  ROOT_ID,
  ensureOverlayRoot,
  renderOverlayError,
  renderOverlayResult,
} from "./overlay";
import { createOverlayViewModel } from "./model";
import { readMonthlyPageSnapshot } from "./page-reader";

type RefreshReason = "dom" | "minute";

type RefreshCache = {
  pageSignature: string | null;
  settingsSignature: string | null;
};

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
    attributeFilter: ["class", "value"],
  });

  return observer;
}

function createSettingsSignature(
  settings: Awaited<ReturnType<typeof getSettings>>,
): string {
  return JSON.stringify({
    standardBreakMinutes: settings.standardBreakMinutes,
    standardWorkdayHours: settings.standardWorkdayHours,
  });
}

export async function startMonthlyRequiredHoursRuntime(
  win: Window = window,
  doc: Document = document,
): Promise<void> {
  let refreshScheduled = false;
  let nextMinuteTimerId: number | null = null;
  let refreshInFlight = false;
  let queuedReason: RefreshReason | null = null;
  const cache: RefreshCache = {
    pageSignature: null,
    settingsSignature: null,
  };

  try {
    const root = ensureOverlayRoot(doc);

    const scheduleNextMinuteRefresh = (): void => {
      if (nextMinuteTimerId !== null) {
        win.clearTimeout(nextMinuteTimerId);
      }

      const now = getNow();
      const delay = getDelayUntilNextMinute(now);

      nextMinuteTimerId = win.setTimeout(() => {
        void queueRefresh("minute");
      }, delay);
    };

    const runRefresh = async (reason: RefreshReason): Promise<void> => {
      const now = getNow();
      const settings = await getSettings();
      const pageSnapshot = readMonthlyPageSnapshot(now, doc);

      if (pageSnapshot === null) {
        renderOverlayError(
          root,
          doc,
          "Monthly timecard data is not available on this page.",
        );
        cache.pageSignature = null;
        cache.settingsSignature = null;
        scheduleNextMinuteRefresh();
        return;
      }

      const settingsSignature = createSettingsSignature(settings);
      const shouldSkipRender =
        reason === "dom" &&
        cache.pageSignature === pageSnapshot.signature &&
        cache.settingsSignature === settingsSignature;

      if (shouldSkipRender) {
        scheduleNextMinuteRefresh();
        return;
      }

      const result = calculateOverlayMetrics({
        now,
        pageSnapshot,
        settings,
      });
      const model = createOverlayViewModel(now, result, settings);

      renderOverlayResult(root, doc, model);
      cache.pageSignature = pageSnapshot.signature;
      cache.settingsSignature = settingsSignature;
      scheduleNextMinuteRefresh();
    };

    const queueRefresh = async (reason: RefreshReason): Promise<void> => {
      if (refreshInFlight) {
        queuedReason =
          queuedReason === "minute" || reason === "minute" ? "minute" : "dom";
        return;
      }

      refreshInFlight = true;

      try {
        await runRefresh(reason);
      } finally {
        refreshInFlight = false;

        if (queuedReason !== null) {
          const nextReason = queuedReason;
          queuedReason = null;
          await queueRefresh(nextReason);
        }
      }
    };

    const scheduleRefresh = (reason: RefreshReason): void => {
      if (refreshScheduled) {
        queuedReason =
          queuedReason === "minute" || reason === "minute" ? "minute" : "dom";
        return;
      }

      refreshScheduled = true;
      win.requestAnimationFrame(() => {
        refreshScheduled = false;
        void queueRefresh(queuedReason === "minute" ? "minute" : reason);
        queuedReason = null;
      });
    };

    observeDocumentChanges(doc, () => {
      scheduleRefresh("dom");
    });
    await queueRefresh("minute");
  } catch (error) {
    if (nextMinuteTimerId !== null) {
      win.clearTimeout(nextMinuteTimerId);
    }

    const root = ensureOverlayRoot(doc);
    renderOverlayError(
      root,
      doc,
      error instanceof Error
        ? error.message
        : "Failed to render extension overlay.",
    );
  }
}
