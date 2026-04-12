import type { OverlayMetricTone } from "@/domain/kot/projection/overlay-metrics";
import type {
  OverlayBadge,
  OverlayDurationMetric,
  OverlayHeaderBadge,
  OverlayProgressMetric,
  OverlayViewModel,
} from "@/entrypoints/content/runtime/overlay/types";

const METRIC_TONE_CLASS_NAME: Record<OverlayMetricTone, string> = {
  error: "kot-extension-metric-value--negative",
  negative: "kot-extension-metric-value--negative",
  neutral: "kot-extension-metric-value--neutral",
  positive: "kot-extension-metric-value--positive",
  warning: "kot-extension-metric-value--warning",
};

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

type SvgAttributes = Record<string, string>;

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

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  doc: Document,
  tagName: K,
  attributes: SvgAttributes = {},
): SVGElementTagNameMap[K] {
  const element = doc.createElementNS(SVG_NAMESPACE, tagName);

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });

  return element;
}

function createHeaderIcon(doc: Document): HTMLSpanElement {
  const wrapper = createElement(doc, "span", "kot-extension-icon");
  const svg = createSvgElement(doc, "svg", {
    viewBox: "0 0 1908.706 1908.706",
    "aria-hidden": "true",
    focusable: "false",
  });
  const group = createSvgElement(doc, "g");

  const shapes = [
    createSvgElement(doc, "ellipse", {
      cx: "1316.553",
      cy: "1674.84",
      rx: "192.391",
      ry: "273.714",
      transform: "translate(-552.152 2697.747) rotate(-80.526)",
      fill: "#149e48",
    }),
    createSvgElement(doc, "path", {
      d: "M1292.518,1571.05c-67.161,130.6-272.185,145.681-320.875,147.5-102.422,3.822-292.57-21.978-355.167-143.93-91.853-178.95,117.508-513.169,346.594-509.107C1186.21,1069.469,1383.78,1393.588,1292.518,1571.05Z",
      fill: "#fff",
      stroke: "#149e48",
      "stroke-miterlimit": "10",
      "stroke-width": "117.845",
    }),
    createSvgElement(doc, "path", {
      d: "M954.353,97.6c-213.523,12.966-324.914,88.124-384,145.1-91.694,88.429-58.75,134.369-214.119,357.455C283.09,705.18,241.549,744.163,225.287,831.97c-4.717,25.47-24.444,131.986,33.622,231.815,88.057,151.392,286.032,168.793,318.524,171.649,54.038,4.75,129.223-3.912,279.593-21.235,40.571-4.674,74.17-9.157,97.327-12.387",
      fill: "none",
      stroke: "#149e48",
      "stroke-miterlimit": "10",
      "stroke-width": "117.845",
      "stroke-linecap": "round",
    }),
    createSvgElement(doc, "path", {
      d: "M954.353,97.6c213.523,12.966,324.914,88.124,384,145.1,91.693,88.429,58.749,134.369,214.119,357.455,73.145,105.025,114.687,144.008,130.949,231.815,4.716,25.47,24.443,131.986-33.622,231.815-88.058,151.392-286.032,168.793-318.525,171.649-54.038,4.75-129.223-3.912-279.593-21.235-40.57-4.674-74.17-9.157-97.327-12.387",
      fill: "none",
      stroke: "#149e48",
      "stroke-miterlimit": "10",
      "stroke-width": "117.845",
      "stroke-linecap": "round",
    }),
    createSvgElement(doc, "ellipse", {
      cx: "733.368",
      cy: "774.462",
      rx: "78.563",
      ry: "162.57",
      fill: "#149e48",
    }),
    createSvgElement(doc, "ellipse", {
      cx: "1172.601",
      cy: "774.625",
      rx: "78.563",
      ry: "162.57",
      fill: "#149e48",
    }),
    createSvgElement(doc, "polygon", {
      points:
        "945.479 346.662 795.931 501.798 639.949 347.602 708.05 283.808 462.037 283.808 462.037 514.261 528.872 451.653 528.879 451.647 795.931 715.908 907.525 612.225 1061.738 455.339 945.479 346.662",
      fill: "#f58403",
    }),
    createSvgElement(doc, "polygon", {
      points:
        "961.948 346.662 1111.495 501.798 1267.477 347.602 1199.376 283.808 1445.39 283.808 1445.39 514.261 1378.554 451.653 1378.547 451.647 1111.495 715.908 999.901 612.225 845.688 455.339 961.948 346.662",
      fill: "#f58403",
    }),
    createSvgElement(doc, "ellipse", {
      cx: "560.679",
      cy: "1621.405",
      rx: "225.877",
      ry: "312.982",
      transform: "translate(-1130.9 1907.543) rotate(-80.526)",
      fill: "#149e48",
    }),
    createSvgElement(doc, "path", {
      d: "M900.206,1218.654c4.318-14.507,22.462-72.14,51.066-76.416,30.2-4.513,59.113,52.372,57.613,76.416C1007.635,1238.707,984.427,1248.748,900.206,1218.654Z",
      fill: "#149e48",
    }),
    createSvgElement(doc, "path", {
      d: "M817.714,115.706C828.59,101.2,874.287,43.565,946.328,39.29c76.052-4.514,148.879,52.372,145.1,76.416C1088.281,135.759,1029.83,145.8,817.714,115.706Z",
      fill: "#149e48",
    }),
  ];

  group.append(...shapes);
  svg.append(group);
  wrapper.append(svg);

  return wrapper;
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
  const element = createElement(
    doc,
    "span",
    "kot-extension-header-badge",
    badge.text,
  );

  element.dataset.tone = badge.tone;
  element.ariaLabel = badge.ariaLabel;
  element.title = badge.title;

  return element;
}

function createHeader(doc: Document, model: OverlayViewModel): HTMLElement {
  const header = createElement(doc, "header", "kot-extension-header");
  const headingGroup = createElement(doc, "div", "kot-extension-header-group");
  const title = createElement(
    doc,
    "span",
    "kot-extension-title",
    "SOT (SERVANT OF TIME)",
  );
  const icon = createHeaderIcon(doc);

  headingGroup.append(createHeaderBadgeElement(doc, model.headerBadge), title);
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
