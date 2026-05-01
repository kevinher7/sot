import { sotSvg } from "@/assets/branding/sot-svg";
import type { OverlayMetricTone } from "@/domain/kot/projection/overlay-metrics";
import type {
  OnSelectWorkMode,
  OnToggleMetricView,
  OverlayDurationMetric,
  OverlayHeaderBadge,
  OverlayModeSelector,
  OverlayRenderCallbacks,
  OverlaySectionModel,
  OverlayViewModel,
} from "@/entrypoints/content/runtime/overlay/types";

const METRIC_TONE_CLASS_NAME: Record<OverlayMetricTone, string> = {
  error: "sot-metric-value--negative",
  negative: "sot-metric-value--negative",
  neutral: "sot-metric-value--neutral",
  positive: "sot-metric-value--positive",
  warning: "sot-metric-value--warning",
};

let headerIconIdSequence = 0;
let hasPulsedThisSession = false;

function createElement<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tagName: K,
  className: string | undefined,
  textContent: string | undefined,
): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tagName);

  if (className !== undefined) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

function createHeaderIconId(prefix: string): string {
  headerIconIdSequence += 1;

  return `${prefix}-${headerIconIdSequence}`;
}

function createHeaderIcon(doc: Document): HTMLSpanElement {
  const wrapper = createElement(doc, "span", "sot-icon", undefined);
  const parsedSvgDocument = new DOMParser().parseFromString(
    sotSvg,
    "image/svg+xml",
  );
  const importedSvg = doc.importNode(parsedSvgDocument.documentElement, true);

  if (!(importedSvg instanceof SVGSVGElement)) {
    return wrapper;
  }

  const leftClipPathId = createHeaderIconId("sot-header-icon-clip-left");
  const rightClipPathId = createHeaderIconId("sot-header-icon-clip-right");

  importedSvg
    .querySelector("#sot-header-icon-clip-left")
    ?.setAttribute("id", leftClipPathId);
  importedSvg
    .querySelector("#sot-header-icon-clip-right")
    ?.setAttribute("id", rightClipPathId);

  importedSvg
    .querySelector('[clip-path="url(#sot-header-icon-clip-left)"]')
    ?.setAttribute("clip-path", `url(#${leftClipPathId})`);
  importedSvg
    .querySelector('[clip-path="url(#sot-header-icon-clip-right)"]')
    ?.setAttribute("clip-path", `url(#${rightClipPathId})`);

  importedSvg.setAttribute("aria-hidden", "true");
  importedSvg.setAttribute("focusable", "false");

  const titleElement = importedSvg.querySelector("title");

  if (titleElement !== null) {
    titleElement.remove();
  }

  const descriptionElement = importedSvg.querySelector("desc");

  if (descriptionElement !== null) {
    descriptionElement.remove();
  }

  wrapper.append(importedSvg);

  return wrapper;
}

function createModeSelector(
  doc: Document,
  model: OverlayModeSelector,
  onSelectWorkMode: OnSelectWorkMode,
): HTMLDivElement {
  const group = createElement(doc, "div", "sot-mode-selector", undefined);

  group.setAttribute("role", "group");
  group.ariaLabel = model.ariaLabel;

  model.options.forEach((option) => {
    const button = createElement(
      doc,
      "button",
      "sot-mode-selector-button",
      option.label,
    );

    button.type = "button";
    button.ariaLabel = option.ariaLabel;
    button.ariaPressed = option.isActive ? "true" : "false";
    button.dataset.active = option.isActive ? "true" : "false";
    button.dataset.mode = option.mode;
    button.addEventListener("click", () => {
      if (option.isActive) {
        return;
      }

      onSelectWorkMode(option.mode);
    });
    group.append(button);
  });

  return group;
}

function createSectionLabel(
  doc: Document,
  model: OverlaySectionModel,
  onSelectWorkMode: OnSelectWorkMode | undefined,
): HTMLDivElement {
  const wrapper = createElement(doc, "div", "sot-section-label-row", undefined);
  const left = createElement(doc, "div", "sot-section-label-wrap", undefined);
  const label = createElement(doc, "span", "sot-section-label", model.label);

  left.append(label);

  model.badges.forEach((badge) => {
    const badgeElement = createElement(
      doc,
      "span",
      "sot-section-badge",
      undefined,
    );
    const iconElement = createElement(
      doc,
      "span",
      "sot-section-badge-icon",
      badge.iconText,
    );
    const countElement = createElement(
      doc,
      "span",
      "sot-section-badge-count",
      badge.countText,
    );

    badgeElement.dataset.tone = badge.tone;
    badgeElement.append(iconElement, countElement);
    left.append(badgeElement);
  });

  wrapper.append(left);

  if (model.modeSelector && onSelectWorkMode) {
    wrapper.append(
      createModeSelector(doc, model.modeSelector, onSelectWorkMode),
    );
  }

  return wrapper;
}

function createDurationMetricCard(
  doc: Document,
  metric: OverlayDurationMetric,
  onToggleMetricView: OnToggleMetricView,
  allowPulse: boolean,
): HTMLElement {
  const binding = metric.viewBinding;
  const card: HTMLElement = binding
    ? createElement(doc, "button", "sot-metric-card", undefined)
    : createElement(doc, "div", "sot-metric-card", undefined);

  if (binding && card instanceof HTMLButtonElement) {
    card.type = "button";
    card.dataset.toggleable = "true";
    card.ariaLabel = `Toggle ${metric.label} view`;
    card.title = `Click to toggle ${metric.label} view`;
    card.addEventListener("click", () => {
      onToggleMetricView(binding);
    });
  }

  const label = createElement(doc, "span", "sot-metric-label", metric.label);
  const valueGroup = createElement(
    doc,
    "div",
    `sot-metric-value ${METRIC_TONE_CLASS_NAME[metric.tone]}`,
    undefined,
  );
  const value = createElement(
    doc,
    "span",
    "sot-metric-value-text",
    metric.value,
  );

  card.dataset.tone = metric.cardTone;
  valueGroup.dataset.appearance = metric.appearance;
  value.dataset.appearance = metric.appearance;

  card.append(label, valueGroup);
  valueGroup.append(value);

  if (metric.unit !== "") {
    const unit = createElement(doc, "span", "sot-metric-unit", metric.unit);

    valueGroup.append(unit);
  }

  if (metric.showNewBadge) {
    card.dataset.newBadge = "true";

    if (allowPulse) {
      card.dataset.pulse = "true";
    }

    const newBadge = createElement(
      doc,
      "span",
      "sot-metric-card-new-badge",
      "NEW",
    );

    card.append(newBadge);
  }

  return card;
}

function createHeaderBadgeElement(
  doc: Document,
  badge: OverlayHeaderBadge,
): HTMLSpanElement {
  const element = createElement(doc, "span", "sot-header-badge", badge.text);

  element.dataset.tone = badge.tone;
  element.ariaLabel = badge.ariaLabel;
  element.title = badge.title;

  return element;
}

function createHeader(doc: Document, model: OverlayViewModel): HTMLElement {
  const header = createElement(doc, "header", "sot-header", undefined);
  const headingGroup = createElement(doc, "div", "sot-header-group", undefined);
  const title = createElement(
    doc,
    "span",
    "sot-title",
    "SOT (SERVANT OF TIME)",
  );
  const icon = createHeaderIcon(doc);

  headingGroup.append(title, createHeaderBadgeElement(doc, model.headerBadge));
  header.append(icon, headingGroup);

  return header;
}

function createTodaySection(
  doc: Document,
  model: OverlayViewModel,
  callbacks: OverlayRenderCallbacks,
  allowPulse: boolean,
): HTMLElement {
  const section = createElement(doc, "section", "sot-section", undefined);
  const metrics = createElement(doc, "div", "sot-metric-stack", undefined);

  model.todaySection.metrics.forEach((metric) => {
    metrics.append(
      createDurationMetricCard(
        doc,
        metric,
        callbacks.onToggleMetricView,
        allowPulse,
      ),
    );
  });

  section.append(
    createSectionLabel(doc, model.todaySection, callbacks.onSelectWorkMode),
    metrics,
  );

  return section;
}

function createMonthSection(
  doc: Document,
  model: OverlayViewModel,
  callbacks: OverlayRenderCallbacks,
  allowPulse: boolean,
): HTMLElement {
  const section = createElement(
    doc,
    "section",
    "sot-section sot-section--month",
    undefined,
  );
  const grid = createElement(doc, "div", "sot-month-grid", undefined);

  model.monthSection.metrics.forEach((metric) => {
    grid.append(
      createDurationMetricCard(
        doc,
        metric,
        callbacks.onToggleMetricView,
        allowPulse,
      ),
    );
  });

  section.append(createSectionLabel(doc, model.monthSection, undefined), grid);

  return section;
}

function createWipPanel(doc: Document): HTMLElement {
  const panel = createElement(doc, "section", "sot-wip-panel", "WIP");

  panel.hidden = true;

  return panel;
}

function createCtaSection(doc: Document, onToggle: () => void): HTMLDivElement {
  const wrapper = createElement(doc, "div", "sot-cta-wrap", undefined);
  const button = createElement(doc, "button", "sot-cta-button", undefined);
  const label = createElement(doc, "span", "sot-cta-label", "Month breakdown");
  const icon = createElement(doc, "span", "sot-cta-icon", "▾");

  button.type = "button";
  button.addEventListener("click", () => {
    icon.classList.toggle("is-expanded");
    onToggle();
  });

  button.append(label, icon);
  wrapper.append(button);

  return wrapper;
}

function createOverlayCard(
  doc: Document,
  model: OverlayViewModel,
  callbacks: OverlayRenderCallbacks,
  allowPulse: boolean,
): HTMLDivElement {
  const shell = createElement(doc, "div", "sot-shell", undefined);
  const divider = createElement(doc, "div", "sot-divider", undefined);
  const content = createElement(doc, "main", "sot-content", undefined);
  const accent = createElement(doc, "div", "sot-accent", undefined);
  const wipPanel = createWipPanel(doc);

  const toggleWipPanel = (): void => {
    wipPanel.hidden = !wipPanel.hidden;
  };

  content.append(
    createTodaySection(doc, model, callbacks, allowPulse),
    createMonthSection(doc, model, callbacks, allowPulse),
    createCtaSection(doc, toggleWipPanel),
    wipPanel,
  );

  shell.append(createHeader(doc, model), divider, content, accent);

  return shell;
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
    [createElement(doc, "div", "sot-shell sot-shell--status", undefined)],
    "loading",
  );

  const shell = root.firstElementChild;

  if (!(shell instanceof HTMLDivElement)) {
    return;
  }

  shell.append(
    createElement(doc, "strong", "sot-status-title", "SOT (SERVANT OF TIME)"),
    createElement(doc, "div", "sot-status-copy", "Loading extension summary…"),
    createElement(doc, "div", "sot-status-copy", message),
  );
}

export function renderOverlayError(
  root: HTMLDivElement,
  doc: Document,
  message: string,
): void {
  renderOverlayChildren(
    root,
    [createElement(doc, "div", "sot-shell sot-shell--status", undefined)],
    "error",
  );

  const shell = root.firstElementChild;

  if (!(shell instanceof HTMLDivElement)) {
    return;
  }

  shell.append(
    createElement(doc, "strong", "sot-status-title", "SOT (SERVANT OF TIME)"),
    createElement(
      doc,
      "div",
      "sot-status-copy",
      "Unable to load extension summary.",
    ),
    createElement(doc, "div", "sot-status-copy", message),
  );
}

export function renderOverlayResult(
  root: HTMLDivElement,
  doc: Document,
  model: OverlayViewModel,
  callbacks: OverlayRenderCallbacks,
): void {
  const allowPulse = !hasPulsedThisSession;

  hasPulsedThisSession = true;

  renderOverlayChildren(
    root,
    [createOverlayCard(doc, model, callbacks, allowPulse)],
    "ready",
  );
}
