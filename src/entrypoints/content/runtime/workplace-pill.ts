import type { Workplace } from "@/domain/kot/workplace";
import {
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_TABLE_BODY_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";
import {
  findMonthlyDateContentHost,
  readMonthlyRowIsoDate,
} from "@/entrypoints/content/kot-page/monthly-page-row-reader";

const PILL_CLASS = "sot-workplace-pill";
const CELL_CLASS = "sot-workplace-cell";

// Days without a 出勤 still get an inert gray pill so the date column keeps the
// same width on every row.
export type WorkplacePillState = Workplace | "none";

export type OnToggleWorkplace = (isoDate: string, next: Workplace) => void;

const PILL_TEXT: Record<WorkplacePillState, string> = {
  none: "",
  office: "社",
  remote: "宅",
};

const PILL_TITLE: Record<WorkplacePillState, string> = {
  none: "出勤打刻のない日",
  office: "出社: クリックでリモートに切替",
  remote: "リモート: クリックで出社に切替",
};

function createPill(
  doc: Document,
  isoDate: string,
  onToggle: OnToggleWorkplace,
): HTMLButtonElement {
  const pill = doc.createElement("button");

  pill.type = "button";
  pill.className = PILL_CLASS;
  pill.dataset.isoDate = isoDate;
  pill.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const current = pill.dataset.workplace;

    if (current !== "office" && current !== "remote") {
      return;
    }

    onToggle(isoDate, current === "office" ? "remote" : "office");
  });

  return pill;
}

// KOT's date text starts with a newline that would render as a gap after the
// pill, so trim it.
function insertPill(host: HTMLElement, pill: HTMLButtonElement): void {
  const dateText = Array.from(host.childNodes).find(
    (node): node is Text =>
      node instanceof Text && (node.textContent ?? "").trim() !== "",
  );

  if (dateText === undefined) {
    host.prepend(pill);

    return;
  }

  dateText.textContent = dateText.textContent?.replace(/^\s+/u, "") ?? "";
  dateText.before(pill);
}

function syncPill(pill: HTMLButtonElement, state: WorkplacePillState): void {
  if (pill.dataset.workplace === state) {
    return;
  }

  pill.dataset.workplace = state;
  pill.textContent = PILL_TEXT[state];
  pill.title = PILL_TITLE[state];
  pill.disabled = state === "none";
}

export function clearWorkplacePills(doc: Document): void {
  for (const pill of doc.querySelectorAll(`.${PILL_CLASS}`)) {
    pill.remove();
  }

  for (const cell of doc.querySelectorAll(`.${CELL_CLASS}`)) {
    cell.classList.remove(CELL_CLASS);
  }
}

// Updates pills in place rather than rebuilding them, since every DOM write
// wakes the page observer and triggers another refresh.
export function applyWorkplacePills(
  doc: Document,
  states: ReadonlyMap<string, WorkplacePillState>,
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

    let pill = dateCell.querySelector<HTMLButtonElement>(`.${PILL_CLASS}`);

    if (pill === null || pill.dataset.isoDate !== isoDate) {
      pill?.remove();
      pill = createPill(doc, isoDate, onToggle);
      insertPill(findMonthlyDateContentHost(dateCell), pill);
    }

    syncPill(pill, states.get(isoDate) ?? "none");
  }
}
