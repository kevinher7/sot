import { ensureOverlayRoot, repositionOverlayRoot } from "./overlay";

function mountOverlay(doc: Document): void {
  if (!doc.body) {
    return;
  }

  ensureOverlayRoot(doc);
}

export function bootstrapContentScript(
  win: Window = window,
  doc: Document = document,
): void {
  const render = () => {
    mountOverlay(doc);
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
