import { getNow, getDelayUntilNextMinute } from "../../platform/time/clock";
import {
  ROOT_ID,
  ensureOverlayRoot,
  renderOverlayError,
  renderOverlayResult,
} from "./overlay";
import { createOverlayViewModel } from "./model";

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

export async function startMonthlyRequiredHoursRuntime(
  win: Window = window,
  doc: Document = document,
): Promise<void> {
  let refreshScheduled = false;
  let nextMinuteTimerId: number | null = null;

  try {
    const root = ensureOverlayRoot(doc);

    const scheduleRefresh = (): void => {
      if (refreshScheduled) {
        return;
      }

      refreshScheduled = true;
      win.requestAnimationFrame(() => {
        refreshScheduled = false;
        refresh();
      });
    };

    const scheduleNextMinuteRefresh = (): void => {
      if (nextMinuteTimerId !== null) {
        win.clearTimeout(nextMinuteTimerId);
      }

      const now = getNow();
      const delay = getDelayUntilNextMinute(now);

      nextMinuteTimerId = win.setTimeout(() => {
        refresh();
      }, delay);
    };

    const refresh = (): void => {
      const now = getNow();
      const model = createOverlayViewModel(now);

      renderOverlayResult(root, doc, model);
      scheduleNextMinuteRefresh();
    };

    observeDocumentChanges(doc, scheduleRefresh);
    refresh();
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
