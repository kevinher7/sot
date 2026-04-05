import type { MonthlyRequiredHoursResult } from "../../domain/kot/monthly-required-hours";
import { positionOverlayRoot } from "./position";

export const ROOT_ID = "kot-extension-root";

function createLine<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tagName: K,
  text: string,
): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tagName);
  element.textContent = text;
  return element;
}

function createValueRow(
  doc: Document,
  label: string,
  value: string,
): HTMLDivElement {
  const row = doc.createElement("div");
  row.className = "kot-extension-row";

  const labelElement = doc.createElement("span");
  labelElement.className = "kot-extension-label";
  labelElement.textContent = label;

  const valueElement = doc.createElement("strong");
  valueElement.className = "kot-extension-value";
  valueElement.textContent = value;

  row.append(labelElement, valueElement);
  return row;
}

function renderOverlayChildren(
  root: HTMLDivElement,
  children: Node[],
  state: string,
): void {
  root.dataset.state = state;
  root.replaceChildren(...children);
}

export function renderOverlayLoading(
  root: HTMLDivElement,
  doc: Document,
  message: string,
): void {
  renderOverlayChildren(
    root,
    [
      createLine(doc, "strong", "KOT Extension"),
      createLine(doc, "div", message),
    ],
    "loading",
  );
}

export function renderOverlayError(
  root: HTMLDivElement,
  doc: Document,
  message: string,
): void {
  renderOverlayChildren(
    root,
    [
      createLine(doc, "strong", "KOT Extension"),
      createLine(doc, "div", "Unable to calculate required hours."),
      createLine(doc, "div", message),
    ],
    "error",
  );
}

export function renderOverlayResult(
  root: HTMLDivElement,
  doc: Document,
  result: MonthlyRequiredHoursResult,
): void {
  renderOverlayChildren(
    root,
    [
      createLine(doc, "strong", "KOT Extension"),
      createValueRow(doc, "Workdays", String(result.workdayCount)),
      createValueRow(doc, "Off days", String(result.offdayCount)),
      createValueRow(doc, "Required hours", `${result.requiredHours}h`),
    ],
    "ready",
  );
}

export function ensureOverlayRoot(doc: Document = document): HTMLDivElement {
  const existing = doc.getElementById(ROOT_ID);
  if (existing instanceof HTMLDivElement) {
    positionOverlayRoot(existing, doc);
    return existing;
  }

  const root = doc.createElement("div");
  root.id = ROOT_ID;

  renderOverlayLoading(root, doc, "Preparing monthly summary...");
  doc.body.append(root);
  positionOverlayRoot(root, doc);

  return root;
}

export function repositionOverlayRoot(doc: Document = document): void {
  const root = doc.getElementById(ROOT_ID);
  if (root instanceof HTMLDivElement) {
    positionOverlayRoot(root, doc);
  }
}
