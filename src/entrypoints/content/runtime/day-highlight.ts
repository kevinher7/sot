import { formatMonthDay } from "@/domain/kot/date";
import {
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_TABLE_BODY_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";

const TODAY_ROW_BACKGROUND = "rgba(255, 237, 213, 0.55)";
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
      for (const td of row.querySelectorAll<HTMLTableCellElement>("td")) {
        td.style.backgroundColor = TODAY_ROW_BACKGROUND;
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
