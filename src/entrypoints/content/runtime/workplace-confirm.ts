import type { Workplace } from "@/domain/kot/workplace";

export const WORKPLACE_CONFIRM_ID = "sot-workplace-confirm";

const VIEWPORT_MARGIN_PX = 8;
const ANCHOR_GAP_PX = 8;
const ARROW_EDGE_INSET_PX = 12;

export type WorkplaceConfirmRequest = {
  anchor: HTMLElement;
  message: string;
  next: Workplace;
  nextMarkerText: string;
  onConfirm: () => void;
};

let openAnchor: HTMLElement | null = null;
let closeListeners: AbortController | null = null;

export function isWorkplaceConfirmOpenFor(anchor: HTMLElement): boolean {
  return openAnchor === anchor;
}

export function closeWorkplaceConfirm(doc: Document): void {
  doc.getElementById(WORKPLACE_CONFIRM_ID)?.remove();
  closeListeners?.abort();
  closeListeners = null;
  openAnchor = null;
}

function createButton(
  doc: Document,
  className: string,
  text: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = doc.createElement("button");

  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);

  return button;
}

function createCard(
  doc: Document,
  request: WorkplaceConfirmRequest,
): HTMLDivElement {
  const card = doc.createElement("div");
  const message = doc.createElement("p");
  const chip = doc.createElement("span");
  const actions = doc.createElement("div");
  const cancel = createButton(doc, "sot-confirm-cancel", "キャンセル", () => {
    closeWorkplaceConfirm(doc);
  });
  // KOT can redraw the table under an open card; never save for a marker that
  // is no longer on the page.
  const confirm = createButton(doc, "sot-confirm-submit", "変更", () => {
    const isAnchorAttached = request.anchor.isConnected;

    closeWorkplaceConfirm(doc);

    if (isAnchorAttached) {
      request.onConfirm();
    }
  });

  card.id = WORKPLACE_CONFIRM_ID;
  card.setAttribute("role", "dialog");
  card.ariaLabel = request.message;
  message.className = "sot-confirm-message";
  chip.className = "sot-confirm-chip";
  chip.dataset.workplace = request.next;
  chip.textContent = request.nextMarkerText;
  actions.className = "sot-confirm-actions";
  confirm.dataset.workplace = request.next;

  message.append(chip, request.message);
  actions.append(cancel, confirm);
  card.append(message, actions);

  return card;
}

// Opens above the anchor, or below it when there is no room at the top of the
// viewport. Aligns with the table row like the correction panel, while the
// arrow still points to the marker.
function placeCard(
  card: HTMLDivElement,
  anchor: HTMLElement,
  win: Window,
): void {
  const anchorRect = anchor.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const anchorCenter = anchorRect.left + anchorRect.width / 2;
  const rowLeft = anchor.closest("tr")?.getBoundingClientRect().left;
  const left = Math.min(
    Math.max(rowLeft ?? anchorRect.left, VIEWPORT_MARGIN_PX),
    win.innerWidth - cardRect.width - VIEWPORT_MARGIN_PX,
  );
  const topAbove = anchorRect.top - cardRect.height - ANCHOR_GAP_PX;
  const fitsAbove = topAbove >= VIEWPORT_MARGIN_PX;

  card.dataset.placement = fitsAbove ? "above" : "below";
  card.style.left = `${left}px`;
  card.style.top = `${fitsAbove ? topAbove : anchorRect.bottom + ANCHOR_GAP_PX}px`;
  const arrowLeft = Math.min(
    Math.max(anchorCenter - left, ARROW_EDGE_INSET_PX),
    cardRect.width - ARROW_EDGE_INSET_PX,
  );

  card.style.setProperty("--sot-confirm-arrow-left", `${arrowLeft}px`);
}

// Scroll closes the card instead of repositioning it, so no scroll handler has
// to run on every frame.
function listenForDismiss(doc: Document, card: HTMLDivElement): void {
  const controller = new AbortController();
  const close = (): void => {
    closeWorkplaceConfirm(doc);
  };

  doc.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        close();
      }
    },
    { signal: controller.signal },
  );
  doc.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target;

      if (
        target instanceof Node &&
        (card.contains(target) || openAnchor?.contains(target) === true)
      ) {
        return;
      }

      close();
    },
    { capture: true, signal: controller.signal },
  );
  doc.addEventListener("scroll", close, {
    capture: true,
    signal: controller.signal,
  });
  doc.defaultView?.addEventListener("resize", close, {
    signal: controller.signal,
  });

  closeListeners = controller;
}

export function openWorkplaceConfirm(
  doc: Document,
  request: WorkplaceConfirmRequest,
): void {
  const win = doc.defaultView;

  closeWorkplaceConfirm(doc);

  if (win === null) {
    return;
  }

  const card = createCard(doc, request);

  doc.body.append(card);
  placeCard(card, request.anchor, win);
  openAnchor = request.anchor;
  listenForDismiss(doc, card);
  card.querySelector<HTMLButtonElement>(".sot-confirm-cancel")?.focus();
}
