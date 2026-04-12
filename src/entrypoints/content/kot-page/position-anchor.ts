import { OVERLAY_POSITION_ANCHOR_SELECTOR } from "@/entrypoints/content/kot-page/contracts";

export function getOverlayAnchorBottom(
  doc: Document = document,
): number | null {
  const pageTitle = doc.querySelector<HTMLHeadingElement>(
    OVERLAY_POSITION_ANCHOR_SELECTOR,
  );

  if (pageTitle === null) {
    return null;
  }

  return pageTitle.getBoundingClientRect().bottom;
}
