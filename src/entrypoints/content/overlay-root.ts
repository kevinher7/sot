import { positionOverlayRoot } from "@/entrypoints/content/position";
import { renderOverlayLoading } from "@/entrypoints/content/overlay-renderer";

export const ROOT_ID = "kot-extension-root";

export function ensureOverlayRoot(doc: Document = document): HTMLDivElement {
  const existing = doc.getElementById(ROOT_ID);

  if (existing instanceof HTMLDivElement) {
    positionOverlayRoot(existing, doc);

    return existing;
  }

  const root = doc.createElement("div");

  root.id = ROOT_ID;

  renderOverlayLoading(root, doc, "Preparing monthly summary...");
  doc.body.append(root);
  positionOverlayRoot(root, doc);

  return root;
}

export function repositionOverlayRoot(doc: Document = document): void {
  const root = doc.getElementById(ROOT_ID);

  if (root instanceof HTMLDivElement) {
    positionOverlayRoot(root, doc);
  }
}
