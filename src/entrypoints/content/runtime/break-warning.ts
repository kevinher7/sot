import type { KotBreakWarningDay } from "@/domain/kot/projection/break-warning";
import {
  MONTHLY_PAGE_BREAK_TOTAL_SELECTOR,
  MONTHLY_PAGE_BREAK_WARNING_CLASS,
  MONTHLY_PAGE_ROW_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";
import { readMonthlyRowIsoDate } from "@/entrypoints/content/kot-page/monthly-page-row-reader";

const WARNING_TITLE_ATTR = "data-sot-break-warning-title";

function buildWarningTitle(warning: KotBreakWarningDay): string {
  return `休憩不足: 必要 ${warning.requiredMinutes}分 / 実績 ${warning.breakMinutes}分`;
}

function reconcileCell(
  cell: HTMLTableCellElement,
  warning: KotBreakWarningDay | undefined,
): void {
  if (warning === undefined) {
    if (cell.classList.contains(MONTHLY_PAGE_BREAK_WARNING_CLASS)) {
      cell.classList.remove(MONTHLY_PAGE_BREAK_WARNING_CLASS);
    }

    if (cell.hasAttribute(WARNING_TITLE_ATTR)) {
      cell.removeAttribute(WARNING_TITLE_ATTR);
      cell.removeAttribute("title");
    }

    return;
  }

  if (!cell.classList.contains(MONTHLY_PAGE_BREAK_WARNING_CLASS)) {
    cell.classList.add(MONTHLY_PAGE_BREAK_WARNING_CLASS);
  }

  const title = buildWarningTitle(warning);

  if (cell.getAttribute("title") !== title) {
    cell.setAttribute("title", title);
    cell.setAttribute(WARNING_TITLE_ATTR, "true");
  }
}

export function applyKotBreakWarnings(
  doc: Document,
  warnings: readonly KotBreakWarningDay[],
): void {
  const byIsoDate = new Map<string, KotBreakWarningDay>();

  for (const warning of warnings) {
    byIsoDate.set(warning.isoDate, warning);
  }

  const rows = doc.querySelectorAll<HTMLTableRowElement>(
    MONTHLY_PAGE_ROW_SELECTOR,
  );

  for (const row of rows) {
    const isoDate = readMonthlyRowIsoDate(row);

    if (isoDate === null) {
      continue;
    }

    const cell = row.querySelector<HTMLTableCellElement>(
      MONTHLY_PAGE_BREAK_TOTAL_SELECTOR,
    );

    if (!cell) {
      continue;
    }

    reconcileCell(cell, byIsoDate.get(isoDate));
  }
}
