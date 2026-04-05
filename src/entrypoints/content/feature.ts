import {
  ROOT_ID,
  ensureOverlayRoot,
  renderOverlayError,
  renderOverlayResult,
  type OverlayViewModel,
} from "./overlay";

function getPlaceholderOverlayModel(): OverlayViewModel {
  return {
    todayWorkLeft: {
      value: "--:--",
      unit: "h",
      tone: "negative",
    },
    todayBreakLeft: {
      value: "--",
      unit: "m",
      tone: "positive",
    },
    monthlyBank: {
      value: "--",
      unit: "h",
      tone: "positive",
    },
    monthlyProgress: {
      label: "Total",
      value: 0,
    },
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
  try {
    const root = ensureOverlayRoot(doc);
    const model = getPlaceholderOverlayModel();
    let refreshScheduled = false;

    const refresh = (): void => {
      refreshScheduled = false;
      renderOverlayResult(root, doc, model);
    };

    const scheduleRefresh = (): void => {
      if (refreshScheduled) {
        return;
      }

      refreshScheduled = true;
      win.requestAnimationFrame(refresh);
    };

    observeDocumentChanges(doc, scheduleRefresh);
    refresh();
  } catch (error) {
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
