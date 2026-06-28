import type { KotRequestInjectionDay } from "@/domain/kot/projection/request-injection";
import {
  formatMinutesAsClock,
  formatMinutesAsHoursDot,
} from "@/domain/kot/time-text";
import {
  MONTHLY_PAGE_BREAK_END_SELECTOR,
  MONTHLY_PAGE_BREAK_START_SELECTOR,
  MONTHLY_PAGE_BREAK_TOTAL_SELECTOR,
  MONTHLY_PAGE_CLOCK_IN_SELECTOR,
  MONTHLY_PAGE_CLOCK_OUT_SELECTOR,
  MONTHLY_PAGE_INJECTED_REQUEST_CLASS,
  MONTHLY_PAGE_INJECTED_REQUEST_MARKER_CLASS,
  MONTHLY_PAGE_INJECTED_REQUEST_SELECTOR,
  MONTHLY_PAGE_REQUEST_MARKER_SELECTOR,
  MONTHLY_PAGE_ROW_SELECTOR,
  MONTHLY_PAGE_WORK_TOTAL_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";
import { readMonthlyRowIsoDate } from "@/entrypoints/content/kot-page/monthly-page-row-reader";

const HIDDEN_MARKER_ATTR = "data-sot-marker-hidden";
const CREATED_PARAGRAPH_ATTR = "data-sot-paragraph";
const REQUEST_TIME_PREFIX = "申";

type ReferenceFont = {
  family: string;
  lineHeight: string;
  size: string;
  style: string;
  weight: string;
};

// Copy the real font off a host punch so injected values match it exactly
// (size + weight included), per the rule to change only the color.
function readReferenceFont(doc: Document): ReferenceFont | null {
  const sample = doc.querySelector<HTMLElement>(
    `${MONTHLY_PAGE_CLOCK_IN_SELECTOR} p, ${MONTHLY_PAGE_CLOCK_OUT_SELECTOR} p, ${MONTHLY_PAGE_BREAK_START_SELECTOR} p, ${MONTHLY_PAGE_BREAK_END_SELECTOR} p`,
  );

  if (!sample) {
    return null;
  }

  const computed = doc.defaultView?.getComputedStyle(sample);

  if (!computed) {
    return null;
  }

  return {
    family: computed.fontFamily,
    lineHeight: computed.lineHeight,
    size: computed.fontSize,
    style: computed.fontStyle,
    weight: computed.fontWeight,
  };
}

function clockTexts(minutes: number | undefined): readonly string[] {
  return minutes === undefined
    ? []
    : [`${REQUEST_TIME_PREFIX} ${formatMinutesAsClock(minutes)}`];
}

function breakTexts(minutes: readonly number[] | undefined): readonly string[] {
  return (minutes ?? []).map(
    (value) => `${REQUEST_TIME_PREFIX} ${formatMinutesAsClock(value)}`,
  );
}

function totalTexts(minutes: number | undefined): readonly string[] {
  return minutes === undefined ? [] : [formatMinutesAsHoursDot(minutes)];
}

// Hide or restore the host's "[申]" marker in a field cell we inject into, so
// the requested time reads as a single "申 HH:MM" rather than alongside "[申]".
function applyHostMarkerVisibility(
  cell: HTMLTableCellElement,
  hidden: boolean,
): void {
  for (const marker of cell.querySelectorAll<HTMLElement>(
    MONTHLY_PAGE_REQUEST_MARKER_SELECTOR,
  )) {
    if (hidden) {
      marker.style.display = "none";
      marker.setAttribute(HIDDEN_MARKER_ATTR, "true");
    } else if (marker.getAttribute(HIDDEN_MARKER_ATTR) === "true") {
      marker.style.display = "";
      marker.removeAttribute(HIDDEN_MARKER_ATTR);
    }
  }
}

// Render the value into the span, wrapping the leading "申" in its own element
// so it can be colored red (host "[申]" red) while the time stays amber. The
// span's textContent stays equal to `text`, so the diff-before-write holds.
function fillInjectedSpan(span: HTMLElement, text: string): void {
  const doc = span.ownerDocument;
  const prefix = `${REQUEST_TIME_PREFIX} `;

  if (!text.startsWith(prefix)) {
    span.textContent = text;

    return;
  }

  const marker = doc.createElement("span");

  marker.className = MONTHLY_PAGE_INJECTED_REQUEST_MARKER_CLASS;
  marker.textContent = REQUEST_TIME_PREFIX;
  span.appendChild(marker);
  span.appendChild(doc.createTextNode(text.slice(REQUEST_TIME_PREFIX.length)));
}

// Resolve the <p> to inject into so the amber value occupies the host's own
// box (and its vertical placement) instead of stacking a second box below it.
// Prefer the paragraph that holds the "[申]" marker; fall back to any existing
// paragraph; otherwise create one tagged for later cleanup.
function resolveContainerParagraph(
  cell: HTMLTableCellElement,
): HTMLParagraphElement {
  const marker = cell.querySelector(MONTHLY_PAGE_REQUEST_MARKER_SELECTOR);
  const markerParagraph = marker?.closest("p");

  if (markerParagraph) {
    return markerParagraph;
  }

  const existingParagraph = cell.querySelector("p");

  if (existingParagraph) {
    return existingParagraph;
  }

  const paragraph = cell.ownerDocument.createElement("p");

  paragraph.setAttribute(CREATED_PARAGRAPH_ATTR, "true");
  cell.appendChild(paragraph);

  return paragraph;
}

// Drop a paragraph we created once it no longer holds an injected value, so an
// empty box does not linger after a request is approved or withdrawn.
function removeCreatedParagraphIfEmpty(cell: HTMLTableCellElement): void {
  for (const paragraph of cell.querySelectorAll<HTMLElement>(
    `p[${CREATED_PARAGRAPH_ATTR}]`,
  )) {
    if (paragraph.childElementCount === 0) {
      paragraph.remove();
    }
  }
}

// Diff-before-write: only mutate the DOM when the desired amber content differs
// from what is already present. Reaching a fixpoint keeps the MutationObserver
// from looping on our own writes.
function reconcileCell(
  row: HTMLTableRowElement,
  selector: string,
  texts: readonly string[],
  hideHostMarker: boolean,
  font: ReferenceFont | null,
): void {
  const cell = row.querySelector<HTMLTableCellElement>(selector);

  if (!cell) {
    return;
  }

  const existing = Array.from(
    cell.querySelectorAll<HTMLElement>(MONTHLY_PAGE_INJECTED_REQUEST_SELECTOR),
  );
  const isUnchanged =
    existing.length === texts.length &&
    existing.every((node, index) => node.textContent === texts[index]);

  if (isUnchanged) {
    return;
  }

  for (const node of existing) {
    node.remove();
  }

  if (texts.length === 0) {
    applyHostMarkerVisibility(cell, false);
    removeCreatedParagraphIfEmpty(cell);

    return;
  }

  const container = resolveContainerParagraph(cell);

  for (const text of texts) {
    const span = cell.ownerDocument.createElement("span");

    span.className = MONTHLY_PAGE_INJECTED_REQUEST_CLASS;
    fillInjectedSpan(span, text);

    if (font) {
      span.style.fontFamily = font.family;
      span.style.fontSize = font.size;
      span.style.fontStyle = font.style;
      span.style.lineHeight = font.lineHeight;
    }

    container.appendChild(span);
  }

  applyHostMarkerVisibility(cell, hideHostMarker);
}

export function applyKotRequestInjections(
  doc: Document,
  injections: readonly KotRequestInjectionDay[],
): void {
  const byIsoDate = new Map<string, KotRequestInjectionDay>();

  for (const injection of injections) {
    byIsoDate.set(injection.isoDate, injection);
  }

  const rows = doc.querySelectorAll<HTMLTableRowElement>(
    MONTHLY_PAGE_ROW_SELECTOR,
  );
  const font = readReferenceFont(doc);

  for (const row of rows) {
    const isoDate = readMonthlyRowIsoDate(row);

    if (isoDate === null) {
      continue;
    }

    const injection = byIsoDate.get(isoDate);

    reconcileCell(
      row,
      MONTHLY_PAGE_CLOCK_IN_SELECTOR,
      clockTexts(injection?.clockInMinutes),
      true,
      font,
    );
    reconcileCell(
      row,
      MONTHLY_PAGE_CLOCK_OUT_SELECTOR,
      clockTexts(injection?.clockOutMinutes),
      true,
      font,
    );
    reconcileCell(
      row,
      MONTHLY_PAGE_BREAK_START_SELECTOR,
      breakTexts(injection?.breakStartMinutes),
      true,
      font,
    );
    reconcileCell(
      row,
      MONTHLY_PAGE_BREAK_END_SELECTOR,
      breakTexts(injection?.breakEndMinutes),
      true,
      font,
    );
    reconcileCell(
      row,
      MONTHLY_PAGE_BREAK_TOTAL_SELECTOR,
      totalTexts(injection?.breakTotalMinutes),
      false,
      font,
    );
    reconcileCell(
      row,
      MONTHLY_PAGE_WORK_TOTAL_SELECTOR,
      totalTexts(injection?.workTotalMinutes),
      false,
      font,
    );
  }
}
