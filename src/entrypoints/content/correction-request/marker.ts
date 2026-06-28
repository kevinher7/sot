import { parseKotIsoDate } from "@/domain/kot/date";
import {
  MONTHLY_PAGE_ACTION_CELL_WORKING_DATE_SELECTOR,
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_TABLE_BODY_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";

export const CORRECTION_MARKER_CLASS = "sot-correction-marker";
export const CORRECTION_CELL_CLASS = "sot-correction-cell";

// Visual state of a day's 申 button. "clean" days (no flag) still get a gray,
// clickable button; "error"/"conflict" days replace KOT's native triangle.
export type KotCorrectionTone = "error" | "conflict" | "clean";

export type KotCorrectionMarkerOpenHandler = (
  isoDate: string,
  row: HTMLTableRowElement,
) => void;

const TONE_TITLE: Record<KotCorrectionTone, string> = {
  clean: "この日の打刻申請を作成",
  conflict: "未承認の申請があります。打刻申請を作成",
  error: "打刻エラー: 打刻申請を作成",
};

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

// KOT renders the date inside a block-level wrapper, so a button appended to the
// <td> drops onto a new line beneath it. Append into the wrapper that actually
// holds the date text so the button flows inline right after it. Anchors are
// skipped (nesting a button inside one is invalid and could navigate).
function findDateContentHost(dateCell: HTMLTableCellElement): HTMLElement {
  for (const child of dateCell.children) {
    if (
      child instanceof HTMLElement &&
      child.tagName !== "IMG" &&
      child.tagName !== "INPUT" &&
      child.tagName !== "A" &&
      (child.textContent ?? "").trim() !== ""
    ) {
      return child;
    }
  }

  return dateCell;
}

function clearMarkers(doc: Document): void {
  for (const marker of doc.querySelectorAll(`.${CORRECTION_MARKER_CLASS}`)) {
    marker.remove();
  }

  // Drop the cell hook so KOT's native error triangle re-appears when our
  // feature is inactive (the triangle is hidden purely via the cell class).
  for (const cell of doc.querySelectorAll(`.${CORRECTION_CELL_CLASS}`)) {
    cell.classList.remove(CORRECTION_CELL_CLASS);
  }
}

export function clearKotCorrectionMarkers(doc: Document): void {
  clearMarkers(doc);
}

function createMarker(
  doc: Document,
  isoDate: string,
  tone: KotCorrectionTone,
  row: HTMLTableRowElement,
  onOpen: KotCorrectionMarkerOpenHandler,
): HTMLButtonElement {
  const marker = doc.createElement("button");

  marker.type = "button";
  marker.className = CORRECTION_MARKER_CLASS;
  marker.dataset.tone = tone;
  marker.textContent = "申";
  marker.title = TONE_TITLE[tone];
  marker.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpen(isoDate, row);
  });

  return marker;
}

// Rebuilt each refresh cycle: clear all existing markers, then drop a fresh
// 申 button into every editable day cell. Flagged days (in `tones`) render red
// or amber; every other day renders a gray, still-clickable button.
export function applyKotCorrectionMarkers(
  doc: Document,
  tones: ReadonlyMap<string, KotCorrectionTone>,
  onOpen: KotCorrectionMarkerOpenHandler,
): void {
  clearMarkers(doc);

  const tableBody = doc.querySelector(MONTHLY_PAGE_TABLE_BODY_SELECTOR);

  if (tableBody === null) {
    return;
  }

  for (const row of tableBody.querySelectorAll<HTMLTableRowElement>("tr")) {
    const isoDate = readRowIsoDate(row);

    if (isoDate === null) {
      continue;
    }

    const dateCell = row.querySelector<HTMLTableCellElement>(
      MONTHLY_PAGE_DATE_CELL_SELECTOR,
    );

    if (dateCell === null) {
      continue;
    }

    dateCell.classList.add(CORRECTION_CELL_CLASS);

    const host = findDateContentHost(dateCell);
    const marker = createMarker(
      doc,
      isoDate,
      tones.get(isoDate) ?? "clean",
      row,
      onOpen,
    );

    // KOT formats the date as `<p>\n06/01（月）\n[<img>]</p>`. Insert the button
    // right after the date text node (not at the end, which on error days sits
    // past the hidden triangle <img>) and trim that node's trailing newline, so
    // the button lands at the same spot on every row.
    const dateText = Array.from(host.childNodes).find(
      (node): node is Text =>
        node instanceof Text && (node.textContent ?? "").trim() !== "",
    );

    if (dateText !== undefined) {
      dateText.textContent = dateText.textContent?.replace(/\s+$/u, "") ?? "";
      dateText.after(marker);
    } else {
      host.append(marker);
    }
  }
}
