import type {
  OverlayCalculationResult,
  OverlayCalculationSettings,
} from "@/domain/kot/projection/overlay-metrics";
import type {
  OverlayBadge,
  OverlayDurationMetric,
  OverlayHeaderBadge,
  OverlayModeSelector,
  OverlaySectionModel,
  OverlayViewModel,
} from "@/entrypoints/content/runtime/overlay/types";

const TODAY_MONTH_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
});

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
});

const TODAY_DAY_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  day: "2-digit",
});

function createDurationMetric(
  label: string,
  appearance: OverlayDurationMetric["appearance"],
  value: string,
  unit: OverlayDurationMetric["unit"],
  tone: OverlayDurationMetric["tone"],
  cardTone: OverlayDurationMetric["cardTone"] = tone,
  viewBinding?: OverlayDurationMetric["viewBinding"],
): OverlayDurationMetric {
  return {
    appearance,
    cardTone,
    label,
    tone,
    unit,
    value,
    viewBinding,
  };
}

function formatTodayLabel(now: Date): string {
  const month = TODAY_MONTH_FORMATTER.format(now);
  const day = TODAY_DAY_FORMATTER.format(now);

  return `TODAY ${month}${day}`;
}

function formatMonthLabel(now: Date): string {
  const month = MONTH_LABEL_FORMATTER.format(now);

  return `MONTH ${month}`;
}

function formatHoursAndMinutes(totalMinutes: number): string {
  const absoluteMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatSignedHoursAndMinutes(totalMinutes: number): string {
  if (totalMinutes === 0) {
    return formatHoursAndMinutes(totalMinutes);
  }

  const prefix = totalMinutes < 0 ? "-" : "+";

  return `${prefix} ${formatHoursAndMinutes(totalMinutes)}`;
}

function createDurationMetricFromProjection(
  metric: OverlayCalculationResult["todayPrimaryMetric"],
): OverlayDurationMetric {
  if (metric.appearance === "rest-day") {
    return createDurationMetric(
      metric.label,
      "rest-day",
      "REST DAY",
      "",
      "neutral",
    );
  }

  return createDurationMetric(
    metric.label,
    metric.appearance,
    metric.format === "signed-duration"
      ? formatSignedHoursAndMinutes(metric.minutes)
      : formatHoursAndMinutes(metric.minutes),
    metric.unit,
    metric.tone,
    metric.cardTone,
    metric.viewBinding,
  );
}

function createBadges(
  errorCount: number,
  warningCount: number,
): OverlayBadge[] {
  const badges: OverlayBadge[] = [];

  if (errorCount > 0) {
    badges.push({
      countText: errorCount.toString(),
      iconText: "⚠",
      tone: "error",
    });
  }

  if (warningCount > 0) {
    badges.push({
      countText: warningCount.toString(),
      iconText: "⚠",
      tone: "warning",
    });
  }

  return badges;
}

function createHeaderBadge(
  result: OverlayCalculationResult,
): OverlayHeaderBadge {
  if (result.todayBadgeStatus === "not-started") {
    return {
      ariaLabel: "Today status: not started",
      text: "準",
      title: "Not started",
      tone: "not-started",
    };
  }

  if (result.todayBadgeStatus === "in-progress") {
    return {
      ariaLabel: "Today status: in progress",
      text: "W",
      title: "In progress",
      tone: "in-progress",
    };
  }

  if (result.todayBadgeStatus === "break") {
    return {
      ariaLabel: "Today status: on break",
      text: "B",
      title: "On break",
      tone: "break",
    };
  }

  if (result.todayBadgeStatus === "finished") {
    return {
      ariaLabel: "Today status: finished",
      text: "終",
      title: "Finished",
      tone: "finished",
    };
  }

  return {
    ariaLabel: "Today status: rest day",
    text: "R",
    title: "Rest day",
    tone: "rest-day",
  };
}

function createModeSelector(
  result: OverlayCalculationResult,
): OverlayModeSelector {
  return {
    ariaLabel: "Work mode",
    options: [
      {
        ariaLabel: "Select full mode",
        isActive: result.workMode === "full",
        label: "FULL",
        mode: "full",
      },
      {
        ariaLabel: "Select intern mode",
        isActive: result.workMode === "intern",
        label: "INTERN",
        mode: "intern",
      },
    ],
  };
}

function createTodaySection(
  now: Date,
  result: OverlayCalculationResult,
): OverlaySectionModel {
  return {
    badges: createBadges(result.todayErrorCount, result.todayWarningCount),
    label: formatTodayLabel(now),
    metrics: [
      createDurationMetricFromProjection(result.todayPrimaryMetric),
      createDurationMetricFromProjection(result.todaySecondaryMetric),
    ],
    modeSelector: createModeSelector(result),
  };
}

function createMonthSection(
  now: Date,
  result: OverlayCalculationResult,
): OverlaySectionModel {
  return {
    badges: createBadges(result.monthErrorCount, result.monthWarningCount),
    label: formatMonthLabel(now),
    metrics: [createDurationMetricFromProjection(result.monthPrimaryMetric)],
  };
}

export function createOverlayViewModel(
  now: Date,
  result: OverlayCalculationResult,
  settings: OverlayCalculationSettings,
): OverlayViewModel {
  void settings;

  return {
    headerBadge: createHeaderBadge(result),
    monthSection: createMonthSection(now, result),
    todaySection: createTodaySection(now, result),
  };
}
