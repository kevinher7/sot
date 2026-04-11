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
  const render = () => {
    void mountOverlay(doc, win);
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
