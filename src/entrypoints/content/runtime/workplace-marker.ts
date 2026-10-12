import type { Workplace } from "@/domain/kot/workplace";
import {
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_TABLE_BODY_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";
import {
  findMonthlyDateContentHost,
  readMonthlyRowIsoDate,
} from "@/entrypoints/content/kot-page/monthly-page-row-reader";
import {
  closeWorkplaceConfirm,
  isWorkplaceConfirmOpenFor,
  openWorkplaceConfirm,
} from "@/entrypoints/content/runtime/workplace-confirm";

const MARKER_CLASS = "sot-workplace-marker";
const CELL_CLASS = "sot-workplace-cell";

// Days without a 出勤 still get an inert gray marker so the date column keeps
// the same width on every row.
export type WorkplaceMarkerState = Workplace | "none";

export type OnToggleWorkplace = (isoDate: string, next: Workplace) => void;

const MARKER_TEXT: Record<WorkplaceMarkerState, string> = {
  none: "",
  office: "社",
  remote: "宅",
};

const MARKER_TITLE: Record<WorkplaceMarkerState, string> = {
  none: "出勤打刻のない日",
  office: "出社: クリックでリモートに切替",
  remote: "リモート: クリックで出社に切替",
};

const CONFIRM_MESSAGE: Record<Workplace, string> = {
  office: "出社に変更しますか？",
  remote: "リモートに変更しますか？",
};

function createMarker(
  doc: Document,
  isoDate: string,
  onToggle: OnToggleWorkplace,
): HTMLButtonElement {
  const marker = doc.createElement("button");

  marker.type = "button";
  marker.className = MARKER_CLASS;
  marker.dataset.isoDate = isoDate;
  marker.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const current = marker.dataset.workplace;

    if (current !== "office" && current !== "remote") {
      return;
    }

    if (isWorkplaceConfirmOpenFor(marker)) {
      closeWorkplaceConfirm(doc);

      return;
    }

    const next = current === "office" ? "remote" : "office";

    openWorkplaceConfirm(doc, {
      anchor: marker,
      message: CONFIRM_MESSAGE[next],
      next,
      nextMarkerText: MARKER_TEXT[next],
      onConfirm: () => {
        onToggle(isoDate, next);
      },
    });
  });

  return marker;
}

// KOT's date text starts with a newline that would render as a gap after the
// marker, so trim it.
function insertMarker(host: HTMLElement, marker: HTMLButtonElement): void {
  const dateText = Array.from(host.childNodes).find(
    (node): node is Text =>
      node instanceof Text && (node.textContent ?? "").trim() !== "",
  );

  if (dateText === undefined) {
    host.prepend(marker);

    return;
  }

  dateText.textContent = dateText.textContent?.replace(/^\s+/u, "") ?? "";
  dateText.before(marker);
}

function syncMarker(
  marker: HTMLButtonElement,
  state: WorkplaceMarkerState,
): void {
  if (marker.dataset.workplace === state) {
    return;
  }

  marker.dataset.workplace = state;
  marker.textContent = MARKER_TEXT[state];
  marker.title = MARKER_TITLE[state];
  marker.disabled = state === "none";
}

export function clearWorkplaceMarkers(doc: Document): void {
  for (const marker of doc.querySelectorAll(`.${MARKER_CLASS}`)) {
    marker.remove();
  }

  for (const cell of doc.querySelectorAll(`.${CELL_CLASS}`)) {
    cell.classList.remove(CELL_CLASS);
  }
}

// Updates markers in place rather than rebuilding them, since every DOM write
// wakes the page observer and triggers another refresh.
export function applyWorkplaceMarkers(
  doc: Document,
  states: ReadonlyMap<string, WorkplaceMarkerState>,
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

    let marker = dateCell.querySelector<HTMLButtonElement>(`.${MARKER_CLASS}`);

    if (marker === null || marker.dataset.isoDate !== isoDate) {
      marker?.remove();
      marker = createMarker(doc, isoDate, onToggle);
      insertMarker(findMonthlyDateContentHost(dateCell), marker);
    }

    syncMarker(marker, states.get(isoDate) ?? "none");
  }
}
