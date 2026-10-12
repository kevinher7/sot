import type { Workplace } from "@/domain/kot/workplace";
import {
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_TABLE_BODY_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";
import {
  findMonthlyDateContentHost,
  readMonthlyRowIsoDate,
} from "@/entrypoints/content/kot-page/monthly-page-row-reader";

const DOT_CLASS = "sot-workplace-dot";
const CELL_CLASS = "sot-workplace-cell";

// Days without a 出勤 still get an inert gray dot so the date column keeps the
// same width on every row.
export type WorkplaceDotState = Workplace | "none";

export type OnToggleWorkplace = (isoDate: string, next: Workplace) => void;

const DOT_TITLE: Record<WorkplaceDotState, string> = {
  none: "出勤打刻のない日",
  office: "出社: クリックでリモートに切替",
  remote: "リモート: クリックで出社に切替",
};

function createDot(
  doc: Document,
  isoDate: string,
  onToggle: OnToggleWorkplace,
): HTMLButtonElement {
  const dot = doc.createElement("button");

  dot.type = "button";
  dot.className = DOT_CLASS;
  dot.dataset.isoDate = isoDate;
  dot.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const current = dot.dataset.workplace;

    if (current !== "office" && current !== "remote") {
      return;
    }

    onToggle(isoDate, current === "office" ? "remote" : "office");
  });

  return dot;
}

// KOT's date text starts with a newline that would render as a gap after the
// dot, so trim it.
function insertDot(host: HTMLElement, dot: HTMLButtonElement): void {
  const dateText = Array.from(host.childNodes).find(
    (node): node is Text =>
      node instanceof Text && (node.textContent ?? "").trim() !== "",
  );

  if (dateText === undefined) {
    host.prepend(dot);

    return;
  }

  dateText.textContent = dateText.textContent?.replace(/^\s+/u, "") ?? "";
  dateText.before(dot);
}

function syncDot(dot: HTMLButtonElement, state: WorkplaceDotState): void {
  if (dot.dataset.workplace === state) {
    return;
  }

  dot.dataset.workplace = state;
  dot.title = DOT_TITLE[state];
  dot.disabled = state === "none";
}

export function clearWorkplaceDots(doc: Document): void {
  for (const dot of doc.querySelectorAll(`.${DOT_CLASS}`)) {
    dot.remove();
  }

  for (const cell of doc.querySelectorAll(`.${CELL_CLASS}`)) {
    cell.classList.remove(CELL_CLASS);
  }
}

// Updates dots in place rather than rebuilding them, since every DOM write
// wakes the page observer and triggers another refresh.
export function applyWorkplaceDots(
  doc: Document,
  states: ReadonlyMap<string, WorkplaceDotState>,
  onToggle: OnToggleWorkplace,
): void {
  const tableBody = doc.querySelector(MONTHLY_PAGE_TABLE_BODY_SELECTOR);

  if (tableBody === null) {
    return;
  }

  for (const row of tableBody.querySelectorAll<HTMLTableRowElement>("tr")) {
    const isoDate = readMonthlyRowIsoDate(row);
    const dateCell = row.querySelector<HTMLTableCellElement>(
      MONTHLY_PAGE_DATE_CELL_SELECTOR,
    );

    if (isoDate === null || dateCell === null) {
      continue;
    }

    if (!dateCell.classList.contains(CELL_CLASS)) {
      dateCell.classList.add(CELL_CLASS);
    }

    let dot = dateCell.querySelector<HTMLButtonElement>(`.${DOT_CLASS}`);

    if (dot === null || dot.dataset.isoDate !== isoDate) {
      dot?.remove();
      dot = createDot(doc, isoDate, onToggle);
      insertDot(findMonthlyDateContentHost(dateCell), dot);
    }

    syncDot(dot, states.get(isoDate) ?? "none");
  }
}
