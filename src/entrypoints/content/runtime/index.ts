import { getDelayUntilNextMinute, getNow } from "@/platform/time/clock";
import { observeDocumentChanges } from "@/entrypoints/content/runtime/dom-observer";
import {
  ensureOverlayRoot,
  renderOverlayError,
} from "@/entrypoints/content/runtime/overlay";
import { createRefreshCoordinator } from "@/entrypoints/content/runtime/refresh-coordinator";
import { createRefreshExecutor } from "@/entrypoints/content/runtime/refresh-executor";
import { createRefreshCache } from "@/entrypoints/content/runtime/state";

export async function startMonthlyRequiredHoursRuntime(
  win: Window = window,
  doc: Document = document,
): Promise<void> {
  let nextMinuteTimerId: number | null = null;
  const cache = createRefreshCache();

  try {
    const root = ensureOverlayRoot(doc);
    let queueModeRefresh = (): void => {};

    const scheduleNextMinuteRefresh = (): void => {
      if (nextMinuteTimerId !== null) {
        win.clearTimeout(nextMinuteTimerId);
      }

      const delay = getDelayUntilNextMinute(getNow());

      nextMinuteTimerId = win.setTimeout(() => {
        void coordinator.queueRefresh("minute");
      }, delay);
    };

    const runRefresh = createRefreshExecutor(
      win,
      doc,
      root,
      cache,
      scheduleNextMinuteRefresh,
      () => {
        queueModeRefresh();
      },
    );
    const coordinator = createRefreshCoordinator(win, runRefresh);

    queueModeRefresh = (): void => {
      void coordinator.queueRefresh("dom");
    };

    observeDocumentChanges(doc, () => {
      coordinator.scheduleRefresh("dom");
    });

    await coordinator.queueRefresh("minute");
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
