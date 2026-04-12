import { getOverlayAnchorBottom } from "@/entrypoints/content/kot-page";

function applyFixedPosition(
  root: HTMLDivElement,
  top: string,
  right = "16px",
): void {
  root.style.position = "fixed";
  root.style.top = top;
  root.style.right = right;
}

export function positionOverlayRoot(
  root: HTMLDivElement,
  doc: Document = document,
): void {
  const anchorBottom = getOverlayAnchorBottom(doc);

  if (anchorBottom === null) {
    applyFixedPosition(root, "16px");

    return;
  }

  applyFixedPosition(root, `${anchorBottom + 16}px`);
}
