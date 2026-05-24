import type {
  OnRecordAction,
  SidebarButtonModel,
  SidebarModel,
} from "@/entrypoints/content/runtime/overlay/types";

export type SidebarElements = {
  sidebar: HTMLDivElement;
  trigger: HTMLDivElement;
};

function createSidebarButton(
  doc: Document,
  model: SidebarButtonModel,
  onRecordAction: OnRecordAction,
): HTMLButtonElement {
  const button = doc.createElement("button");

  button.className = "sot-sidebar-btn";
  button.type = "button";
  button.textContent = model.label;
  button.dataset.action = model.action;
  button.dataset.status = model.status;
  button.ariaLabel = model.label;

  if (model.status === "pending" || model.status === "dimmed") {
    button.disabled = true;
  }

  button.addEventListener("click", () => {
    if (model.status === "pending" || model.status === "dimmed") {
      return;
    }

    onRecordAction(model.action);
  });

  return button;
}

function bindHoverBehavior(
  sidebar: HTMLDivElement,
  trigger: HTMLDivElement,
): void {
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;

  const show = (): void => {
    clearTimeout(hideTimeout);
    sidebar.dataset.expanded = "true";
  };

  const hide = (): void => {
    hideTimeout = setTimeout(() => {
      delete sidebar.dataset.expanded;
    }, 80);
  };

  trigger.addEventListener("mouseenter", show);
  trigger.addEventListener("mouseleave", hide);
  sidebar.addEventListener("mouseenter", show);
  sidebar.addEventListener("mouseleave", hide);
}

export function createSidebarElements(
  doc: Document,
  model: SidebarModel,
  onRecordAction: OnRecordAction,
): SidebarElements {
  const sidebar = doc.createElement("div");
  const trigger = doc.createElement("div");
  const board = doc.createElement("div");

  sidebar.className = "sot-sidebar";
  trigger.className = "sot-sidebar-trigger";
  board.className = "sot-sidebar-board";

  if (!model.visible) {
    sidebar.hidden = true;
    trigger.hidden = true;

    return { sidebar, trigger };
  }

  model.buttons.forEach((buttonModel) => {
    board.append(createSidebarButton(doc, buttonModel, onRecordAction));
  });

  sidebar.append(board);
  bindHoverBehavior(sidebar, trigger);

  return { sidebar, trigger };
}
