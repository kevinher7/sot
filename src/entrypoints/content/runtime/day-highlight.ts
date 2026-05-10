import { formatMonthDay } from "@/domain/kot/date";
import {
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_OFFDAY_CLASS_NAMES,
  MONTHLY_PAGE_OFFDAY_WORK_DAY_TYPE_PATTERNS,
  MONTHLY_PAGE_TABLE_BODY_SELECTOR,
  MONTHLY_PAGE_WORK_DAY_TYPE_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";

const WORKDAY_ROW_BACKGROUND = "#E2F4E9";
const OFFDAY_ROW_BACKGROUND = "#D4D6D6";
const HIGHLIGHTED_ATTR = "data-sot-highlighted";

export function applyTodayRowHighlight(doc: Document, now: Date): void {
  const todayPrefix = formatMonthDay(now);
  const tableBody = doc.querySelector(MONTHLY_PAGE_TABLE_BODY_SELECTOR);

  if (!tableBody) {
    return;
  }

  const dateCells = tableBody.querySelectorAll<HTMLTableCellElement>(
    MONTHLY_PAGE_DATE_CELL_SELECTOR,
  );

  for (const cell of dateCells) {
    const p = cell.querySelector("p");
    const text = p?.textContent?.trim() ?? "";
    const row = cell.closest("tr");

    if (!row) {
      continue;
    }

    if (text.startsWith(todayPrefix)) {
      const background = isOffday(cell, row)
        ? OFFDAY_ROW_BACKGROUND
        : WORKDAY_ROW_BACKGROUND;

      for (const td of row.querySelectorAll<HTMLTableCellElement>("td")) {
        td.style.backgroundColor = background;
      }

      row.setAttribute(HIGHLIGHTED_ATTR, "true");
    } else if (row.getAttribute(HIGHLIGHTED_ATTR) === "true") {
      for (const td of row.querySelectorAll<HTMLTableCellElement>("td")) {
        td.style.backgroundColor = "";
      }

      row.removeAttribute(HIGHLIGHTED_ATTR);
    }
  }
}

function isOffday(
  dateCell: HTMLTableCellElement,
  row: HTMLTableRowElement,
): boolean {
  if (
    MONTHLY_PAGE_OFFDAY_CLASS_NAMES.some((className) =>
      dateCell.classList.contains(className),
    )
  ) {
    return true;
  }

  const workDayTypeCell = row.querySelector(
    MONTHLY_PAGE_WORK_DAY_TYPE_SELECTOR,
  );
  const workDayTypeText = workDayTypeCell?.textContent?.trim() ?? "";

  return MONTHLY_PAGE_OFFDAY_WORK_DAY_TYPE_PATTERNS.some((pattern) =>
    pattern.test(workDayTypeText),
  );
}
