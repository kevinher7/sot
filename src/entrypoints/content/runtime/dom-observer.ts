import { ROOT_ID } from "@/entrypoints/content/runtime/overlay/root";
import { WORKPLACE_CONFIRM_ID } from "@/entrypoints/content/runtime/workplace-confirm";

const EXTENSION_LAYER_SELECTOR = `#${ROOT_ID}, #${WORKPLACE_CONFIRM_ID}`;

function isOverlayMutationTarget(node: Node): boolean {
  const element = node instanceof HTMLElement ? node : node.parentElement;

  return element !== null && element.closest(EXTENSION_LAYER_SELECTOR) !== null;
}

function isExtensionNode(node: Node): boolean {
  return node instanceof HTMLElement && node.matches(EXTENSION_LAYER_SELECTOR);
}

// Appending or removing our own layers on <body> targets <body> itself, so
// also check what was added or removed. An empty node list must not count, or
// attribute changes on <body> would be ignored.
function isExtensionMutation(record: MutationRecord): boolean {
  if (isOverlayMutationTarget(record.target)) {
    return true;
  }

  const changedNodes = [...record.addedNodes, ...record.removedNodes];

  return changedNodes.length > 0 && changedNodes.every(isExtensionNode);
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
      (record) => !isExtensionMutation(record),
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
