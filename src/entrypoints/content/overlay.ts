import { positionOverlayRoot } from "./position";

export const ROOT_ID = "kot-extension-root";

function renderOverlayContent(root: HTMLDivElement, doc: Document): void {
  root.dataset.state = "placeholder";
  root.replaceChildren(
    createLine(doc, "strong", "KOT Extension"),
    createLine(doc, "div", "Scaffold active for monthly working page."),
    createLine(doc, "div", "Feature logic has not been implemented yet."),
  );
}

function createLine<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tagName: K,
  text: string,
): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tagName);
  element.textContent = text;
  return element;
}

export function ensureOverlayRoot(doc: Document = document): HTMLDivElement {
  const existing = doc.getElementById(ROOT_ID);
  if (existing instanceof HTMLDivElement) {
    positionOverlayRoot(existing, doc);
    return existing;
  }

  const root = doc.createElement("div");
  root.id = ROOT_ID;

  renderOverlayContent(root, doc);
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
