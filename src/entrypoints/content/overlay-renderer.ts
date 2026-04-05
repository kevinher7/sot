import type { OverlayMetricTone } from "../../domain/kot/overlay-calculations";
import type {
  OverlayBadge,
  OverlayDurationMetric,
  OverlayProgressMetric,
  OverlayViewModel,
} from "./overlay-types";

const METRIC_TONE_CLASS_NAME: Record<OverlayMetricTone, string> = {
  negative: "kot-extension-metric-value--negative",
  neutral: "kot-extension-metric-value--neutral",
  positive: "kot-extension-metric-value--positive",
  warning: "kot-extension-metric-value--warning",
};

function createElement<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tagName: K,
  className?: string,
  textContent?: string,
): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

function createSectionLabel(
  doc: Document,
  text: string,
  badges: readonly OverlayBadge[] = [],
): HTMLDivElement {
  const wrapper = createElement(doc, "div", "kot-extension-section-label-wrap");
  const label = createElement(doc, "span", "kot-extension-section-label", text);

  wrapper.append(label);

  badges.forEach((badge) => {
    const badgeElement = createElement(
      doc,
      "span",
      "kot-extension-section-badge",
    );
    const iconElement = createElement(
      doc,
      "span",
      "kot-extension-section-badge-icon",
      badge.iconText,
    );
    const countElement = createElement(
      doc,
      "span",
      "kot-extension-section-badge-count",
      badge.countText,
    );

    badgeElement.dataset.tone = badge.tone;
    badgeElement.append(iconElement, countElement);
    wrapper.append(badgeElement);
  });

  return wrapper;
}

function createDurationMetricCard(
  doc: Document,
  labelText: string,
  metric: OverlayDurationMetric,
): HTMLDivElement {
  const card = createElement(doc, "div", "kot-extension-metric-card");
  const label = createElement(
    doc,
    "span",
    "kot-extension-metric-label",
    labelText,
  );
  const valueGroup = createElement(
    doc,
    "div",
    `kot-extension-metric-value ${METRIC_TONE_CLASS_NAME[metric.tone]}`,
  );
  const value = createElement(
    doc,
    "span",
    "kot-extension-metric-value-text",
    metric.value,
  );
  card.dataset.tone = metric.cardTone;
  valueGroup.dataset.appearance = metric.appearance;
  value.dataset.appearance = metric.appearance;

  valueGroup.append(value);

  if (metric.unit !== "") {
    const unit = createElement(
      doc,
      "span",
      "kot-extension-metric-unit",
      metric.unit,
    );

    valueGroup.append(unit);
  }

  card.append(label, valueGroup);
  return card;
}

function createProgressFill(
  doc: Document,
  className: string,
  percent: number,
  tone: OverlayMetricTone,
): HTMLDivElement {
  const fill = createElement(doc, "div", className);
  const safeValue = Math.max(0, Math.min(100, percent));

  fill.dataset.tone = tone;
  fill.style.width = `${safeValue}%`;

  return fill;
}

function createProgressCard(
  doc: Document,
  metric: OverlayProgressMetric,
): HTMLDivElement {
  const card = createElement(doc, "div", "kot-extension-progress-card");
  const label = createElement(
    doc,
    "span",
    "kot-extension-metric-label",
    metric.label,
  );
  const rail = createElement(doc, "div", "kot-extension-progress-rail");

  card.dataset.tone = metric.tone;
  rail.append(
    createProgressFill(
      doc,
      "kot-extension-progress-fill kot-extension-progress-fill--estimated",
      metric.estimatedPercent,
      metric.tone,
    ),
    createProgressFill(
      doc,
      "kot-extension-progress-fill kot-extension-progress-fill--actual",
      metric.actualPercent,
      metric.tone,
    ),
  );
  card.append(label, rail);

  return card;
}

function createHeader(doc: Document): HTMLElement {
  const header = createElement(doc, "header", "kot-extension-header");
  const headingGroup = createElement(doc, "div", "kot-extension-header-group");
  const statusDot = createElement(doc, "div", "kot-extension-status-dot");
  const title = createElement(
    doc,
    "span",
    "kot-extension-title",
    "SOT (SERVANT OF TIME)",
  );
  const icon = createElement(doc, "span", "kot-extension-icon", "◷");

  headingGroup.append(statusDot, title);
  header.append(headingGroup, icon);

  return header;
}

function createTodaySection(
  doc: Document,
  model: OverlayViewModel,
): HTMLElement {
  const section = createElement(doc, "section", "kot-extension-section");
  const metrics = createElement(doc, "div", "kot-extension-metric-stack");

  metrics.append(
    createDurationMetricCard(doc, "Work left", model.todayWorkLeft),
    createDurationMetricCard(doc, "Break left", model.todayBreakLeft),
  );

  section.append(createSectionLabel(doc, model.todayLabel), metrics);
  return section;
}

function createMonthSection(
  doc: Document,
  model: OverlayViewModel,
): HTMLElement {
  const section = createElement(
    doc,
    "section",
    "kot-extension-section kot-extension-section--month",
  );
  const grid = createElement(doc, "div", "kot-extension-month-grid");

  grid.append(
    createDurationMetricCard(doc, "Bank", model.monthlyBank),
    createProgressCard(doc, model.monthlyProgress),
  );

  section.append(
    createSectionLabel(doc, model.monthLabel, model.monthErrorBadges),
    grid,
  );
  return section;
}

function createWipPanel(doc: Document): HTMLElement {
  const panel = createElement(doc, "section", "kot-extension-wip-panel", "WIP");
  panel.hidden = true;
  return panel;
}

function createCtaSection(doc: Document, onToggle: () => void): HTMLDivElement {
  const wrapper = createElement(doc, "div", "kot-extension-cta-wrap");
  const button = createElement(doc, "button", "kot-extension-cta-button");
  const label = createElement(
    doc,
    "span",
    "kot-extension-cta-label",
    "Month breakdown",
  );
  const icon = createElement(doc, "span", "kot-extension-cta-icon", "▾");

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
): HTMLDivElement {
  const shell = createElement(doc, "div", "kot-extension-shell");
  const divider = createElement(doc, "div", "kot-extension-divider");
  const content = createElement(doc, "main", "kot-extension-content");
  const accent = createElement(doc, "div", "kot-extension-accent");
  const wipPanel = createWipPanel(doc);

  const toggleWipPanel = (): void => {
    wipPanel.hidden = !wipPanel.hidden;
  };

  content.append(
    createTodaySection(doc, model),
    createMonthSection(doc, model),
    createCtaSection(doc, toggleWipPanel),
    wipPanel,
  );

  shell.append(createHeader(doc), divider, content, accent);
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
    [
      createElement(
        doc,
        "div",
        "kot-extension-shell kot-extension-shell--status",
      ),
    ],
    "loading",
  );

  const shell = root.firstElementChild;
  if (!(shell instanceof HTMLDivElement)) {
    return;
  }

  shell.append(
    createElement(
      doc,
      "strong",
      "kot-extension-status-title",
      "SOT (SERVANT OF TIME)",
    ),
    createElement(doc, "div", "kot-extension-status-copy", message),
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
      createElement(
        doc,
        "div",
        "kot-extension-shell kot-extension-shell--status",
      ),
    ],
    "error",
  );

  const shell = root.firstElementChild;
  if (!(shell instanceof HTMLDivElement)) {
    return;
  }

  shell.append(
    createElement(
      doc,
      "strong",
      "kot-extension-status-title",
      "SOT (SERVANT OF TIME)",
    ),
    createElement(
      doc,
      "div",
      "kot-extension-status-copy",
      "Unable to load extension summary.",
    ),
    createElement(doc, "div", "kot-extension-status-copy", message),
  );
}

export function renderOverlayResult(
  root: HTMLDivElement,
  doc: Document,
  model: OverlayViewModel,
): void {
  renderOverlayChildren(root, [createOverlayCard(doc, model)], "ready");
}
