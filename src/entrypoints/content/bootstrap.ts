import { isMonthlyIndividualWorkingListPage } from "@/domain/kot/page";
import {
  ensureOverlayRoot,
  repositionOverlayRoot,
} from "@/entrypoints/content/overlay";
import { startMonthlyRequiredHoursRuntime } from "@/entrypoints/content/runtime";

async function mountOverlay(doc: Document, win: Window): Promise<void> {
  if (!doc.body) {
    return;
  }

  ensureOverlayRoot(doc);
  await startMonthlyRequiredHoursRuntime(win, doc);
}

export function bootstrapContentScript(
  win: Window = window,
  doc: Document = document,
): void {
  let hasMounted = false;
  let pageObserver: MutationObserver | null = null;

  const tryMount = (): void => {
    const currentUrl = new URL(win.location.href);

    if (hasMounted || !isMonthlyIndividualWorkingListPage(currentUrl, doc)) {
      return;
    }

    hasMounted = true;
    pageObserver?.disconnect();
    pageObserver = null;
    void mountOverlay(doc, win);
  };

  const render = () => {
    tryMount();

    if (hasMounted || !doc.body) {
      return;
    }

    pageObserver = new MutationObserver(() => {
      tryMount();
    });
    pageObserver.observe(doc.body, {
      childList: true,
      subtree: true,
    });
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }

  win.addEventListener("resize", () => {
    repositionOverlayRoot(doc);
  });
}
