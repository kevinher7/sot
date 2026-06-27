import { parseKotIsoDate } from "@/domain/kot/date";
import type { KotCorrectionNeed } from "@/domain/kot/calculation/requests/correction-need";
import {
  MONTHLY_PAGE_ACTION_CELL_WORKING_DATE_SELECTOR,
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_TABLE_BODY_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";

export const CORRECTION_MARKER_CLASS = "sot-correction-marker";

export type KotCorrectionMarkerOpenHandler = (
  isoDate: string,
  row: HTMLTableRowElement,
) => void;

function readRowIsoDate(row: HTMLTableRowElement): string | null {
  const raw = row
    .querySelector<HTMLInputElement>(
      MONTHLY_PAGE_ACTION_CELL_WORKING_DATE_SELECTOR,
    )
    ?.value.trim();

  if (raw === undefined || raw === "") {
    return null;
  }

  return parseKotIsoDate(raw);
}

function removeExistingMarkers(doc: Document): void {
  for (const marker of doc.querySelectorAll(`.${CORRECTION_MARKER_CLASS}`)) {
    marker.remove();
  }
}

function createMarker(
  doc: Document,
  isoDate: string,
  row: HTMLTableRowElement,
  onOpen: KotCorrectionMarkerOpenHandler,
): HTMLButtonElement {
  const marker = doc.createElement("button");

  marker.type = "button";
  marker.className = CORRECTION_MARKER_CLASS;
  marker.textContent = "申請";
  marker.title = "この日の打刻申請を作成";
  marker.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpen(isoDate, row);
  });

  return marker;
}

// Rebuilt each refresh cycle: clear all existing markers, then append a fresh
// marker into the date cell of every flagged day.
export function applyKotCorrectionMarkers(
  doc: Document,
  needs: readonly KotCorrectionNeed[],
  onOpen: KotCorrectionMarkerOpenHandler,
): void {
  removeExistingMarkers(doc);

  if (needs.length === 0) {
    return;
  }

  const needByIsoDate = new Map(needs.map((need) => [need.isoDate, need]));
  const tableBody = doc.querySelector(MONTHLY_PAGE_TABLE_BODY_SELECTOR);

  if (tableBody === null) {
    return;
  }

  for (const row of tableBody.querySelectorAll<HTMLTableRowElement>("tr")) {
    const isoDate = readRowIsoDate(row);

    if (isoDate === null || !needByIsoDate.has(isoDate)) {
      continue;
    }

    const dateCell = row.querySelector<HTMLTableCellElement>(
      MONTHLY_PAGE_DATE_CELL_SELECTOR,
    );

    if (dateCell === null) {
      continue;
    }

    dateCell.append(createMarker(doc, isoDate, row, onOpen));
  }
}
