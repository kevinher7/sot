import { MONTHLY_PAGE_TABLE_BODY_SELECTOR } from "@/entrypoints/content/kot-page/contracts";

// KOT's floating header is a clone of <thead> whose column widths are copied
// from the body once at init and again on window resize. The markers we inject
// (申 buttons, amber request times) can widen body columns after that init, so
// the clone drifts out of line with the rows. A synthetic resize asks KOT to
// re-measure.

export function captureKotColumnWidths(doc: Document): readonly number[] {
  const firstRow = doc.querySelector(`${MONTHLY_PAGE_TABLE_BODY_SELECTOR} tr`);

  if (firstRow === null) {
    return [];
  }

  return Array.from(firstRow.children, (cell) =>
    cell.getBoundingClientRect().width,
  );
}

export function resyncKotFloatingHeaderIfColumnsChanged(
  doc: Document,
  win: Window,
  before: readonly number[],
): void {
  const after = captureKotColumnWidths(doc);
  const changed =
    before.length !== after.length ||
    before.some((width, index) => width !== after[index]);

  if (changed) {
    win.dispatchEvent(new Event("resize"));
  }
}
