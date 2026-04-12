import { sotSvg } from "@/assets/branding/sot-svg";
import type { OverlayMetricTone } from "@/domain/kot/projection/overlay-metrics";
import type {
  OverlayBadge,
  OverlayDurationMetric,
  OverlayHeaderBadge,
  OverlayProgressMetric,
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

function createHeaderIconId(prefix: string): string {
  headerIconIdSequence += 1;

  return `${prefix}-${headerIconIdSequence}`;
}

function createHeaderIcon(doc: Document): HTMLSpanElement {
  const wrapper = createElement(doc, "span", "sot-icon");
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

function createSectionLabel(
  doc: Document,
  text: string,
  badges: readonly OverlayBadge[] = [],
): HTMLDivElement {
  const wrapper = createElement(doc, "div", "sot-section-label-wrap");
  const label = createElement(doc, "span", "sot-section-label", text);

  wrapper.append(label);

  badges.forEach((badge) => {
    const badgeElement = createElement(doc, "span", "sot-section-badge");
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
    wrapper.append(badgeElement);
  });

  return wrapper;
}

function createDurationMetricCard(
  doc: Document,
  labelText: string,
  metric: OverlayDurationMetric,
): HTMLDivElement {
  const card = createElement(doc, "div", "sot-metric-card");
  const label = createElement(doc, "span", "sot-metric-label", labelText);
  const valueGroup = createElement(
    doc,
    "div",
    `sot-metric-value ${METRIC_TONE_CLASS_NAME[metric.tone]}`,
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

  valueGroup.append(value);

  if (metric.unit !== "") {
    const unit = createElement(doc, "span", "sot-metric-unit", metric.unit);

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
  const card = createElement(doc, "div", "sot-progress-card");
  const label = createElement(doc, "span", "sot-metric-label", metric.label);
  const rail = createElement(doc, "div", "sot-progress-rail");

  card.dataset.tone = metric.tone;
  rail.append(
    createProgressFill(
      doc,
      "sot-progress-fill sot-progress-fill--estimated",
      metric.estimatedPercent,
      metric.tone,
    ),
    createProgressFill(
      doc,
      "sot-progress-fill sot-progress-fill--actual",
      metric.actualPercent,
      "positive",
    ),
  );
  card.append(label, rail);

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
  const header = createElement(doc, "header", "sot-header");
  const headingGroup = createElement(doc, "div", "sot-header-group");
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
): HTMLElement {
  const section = createElement(doc, "section", "sot-section");
  const metrics = createElement(doc, "div", "sot-metric-stack");

  metrics.append(
    createDurationMetricCard(doc, "Work left", model.todayWorkLeft),
    createDurationMetricCard(doc, "Break left", model.todayBreakLeft),
  );

  section.append(
    createSectionLabel(doc, model.todayLabel, model.todayErrorBadges),
    metrics,
  );

  return section;
}

function createMonthSection(
  doc: Document,
  model: OverlayViewModel,
): HTMLElement {
  const section = createElement(
    doc,
    "section",
    "sot-section sot-section--month",
  );
  const grid = createElement(doc, "div", "sot-month-grid");

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
  const panel = createElement(doc, "section", "sot-wip-panel", "WIP");

  panel.hidden = true;

  return panel;
}

function createCtaSection(doc: Document, onToggle: () => void): HTMLDivElement {
  const wrapper = createElement(doc, "div", "sot-cta-wrap");
  const button = createElement(doc, "button", "sot-cta-button");
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
): HTMLDivElement {
  const shell = createElement(doc, "div", "sot-shell");
  const divider = createElement(doc, "div", "sot-divider");
  const content = createElement(doc, "main", "sot-content");
  const accent = createElement(doc, "div", "sot-accent");
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
    [createElement(doc, "div", "sot-shell sot-shell--status")],
    "loading",
  );

  const shell = root.firstElementChild;

  if (!(shell instanceof HTMLDivElement)) {
    return;
  }

  shell.append(
    createElement(doc, "strong", "sot-status-title", "SOT (SERVANT OF TIME)"),
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
    [createElement(doc, "div", "sot-shell sot-shell--status")],
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
): void {
  renderOverlayChildren(root, [createOverlayCard(doc, model)], "ready");
}
