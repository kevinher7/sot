import { ROOT_ID } from "@/entrypoints/content/runtime/overlay/root";
import { WORKPLACE_CONFIRM_ID } from "@/entrypoints/content/runtime/workplace-confirm";

const EXTENSION_LAYER_SELECTOR = `#${ROOT_ID}, #${WORKPLACE_CONFIRM_ID}`;

function isOverlayMutationTarget(node: Node): boolean {
  const element = node instanceof HTMLElement ? node : node.parentElement;

  return element !== null && element.closest(EXTENSION_LAYER_SELECTOR) !== null;
}

export function observeDocumentChanges(
  doc: Document,
  onChange: () => void,
): MutationObserver | null {
  if (!doc.body) {
    return null;
  }

  const observer = new MutationObserver((records) => {
    const hasNonOverlayMutation = records.some(
      (record) => !isOverlayMutationTarget(record.target),
    );

    if (hasNonOverlayMutation) {
      onChange();
    }
  });

  observer.observe(doc.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "value"],
  });

  return observer;
}
