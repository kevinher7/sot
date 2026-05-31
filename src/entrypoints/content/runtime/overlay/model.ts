import type {
  OverlayCalculationResult,
  TodayBadgeStatus,
} from "@/domain/kot/projection/overlay-metrics";
import type { ExtensionSettings, SeenBoxes } from "@/domain/kot/types";
import type { RecordAction } from "@/entrypoints/content/runtime/recorder/types";
import type {
  OverlayBadge,
  OverlayDurationMetric,
  OverlayHeaderBadge,
  OverlayModeSelector,
  OverlaySectionModel,
  OverlayViewModel,
  SidebarButtonModel,
  SidebarButtonStatus,
  SidebarModel,
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
  cardTone: OverlayDurationMetric["cardTone"],
  viewBinding: OverlayDurationMetric["viewBinding"],
  showNewBadge: boolean,
): OverlayDurationMetric {
  return {
    appearance,
    cardTone,
    label,
    showNewBadge,
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
  seenBoxes: SeenBoxes,
): OverlayDurationMetric {
  const showNewBadge =
    metric.viewBinding !== undefined &&
    seenBoxes[metric.viewBinding.viewKey] === false;

  if (metric.appearance === "rest-day") {
    return createDurationMetric(
      metric.label,
      "rest-day",
      "REST DAY",
      "",
      "neutral",
      "neutral",
      undefined,
      false,
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
    showNewBadge,
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
  seenBoxes: SeenBoxes,
): OverlaySectionModel {
  return {
    badges: createBadges(result.todayErrorCount, result.todayWarningCount),
    label: formatTodayLabel(now),
    metrics: [
      createDurationMetricFromProjection(result.todayPrimaryMetric, seenBoxes),
      createDurationMetricFromProjection(
        result.todaySecondaryMetric,
        seenBoxes,
      ),
    ],
    modeSelector: createModeSelector(result),
  };
}

function createMonthSection(
  now: Date,
  result: OverlayCalculationResult,
  seenBoxes: SeenBoxes,
): OverlaySectionModel {
  return {
    badges: createBadges(result.monthErrorCount, result.monthWarningCount),
    label: formatMonthLabel(now),
    metrics: [
      createDurationMetricFromProjection(result.monthPrimaryMetric, seenBoxes),
    ],
    modeSelector: undefined,
  };
}

const SIDEBAR_BUTTONS: readonly { action: RecordAction; label: string }[] = [
  { action: "clock-in", label: "出勤" },
  { action: "break-start", label: "休始" },
  { action: "break-end", label: "休終" },
  { action: "clock-out", label: "退勤" },
];

const HIGHLIGHTED_ACTIONS: Record<
  TodayBadgeStatus,
  ReadonlySet<RecordAction>
> = {
  "not-started": new Set(["clock-in"]),
  "in-progress": new Set(["break-start", "clock-out"]),
  break: new Set(["break-end"]),
  finished: new Set(),
  "rest-day": new Set(),
};

function resolveSidebarButtonStatus(
  action: RecordAction,
  status: TodayBadgeStatus,
  pendingAction: RecordAction | null,
): SidebarButtonStatus {
  if (pendingAction === action) {
    return "pending";
  }

  if (pendingAction !== null) {
    return "dimmed";
  }

  if (HIGHLIGHTED_ACTIONS[status].has(action)) {
    return "highlighted";
  }

  return "dimmed";
}

function createSidebarModel(
  status: TodayBadgeStatus,
  pendingAction: RecordAction | null,
): SidebarModel {
  const visible = true;

  const buttons: SidebarButtonModel[] = SIDEBAR_BUTTONS.map(
    ({ action, label }) => ({
      action,
      label,
      status: resolveSidebarButtonStatus(action, status, pendingAction),
    }),
  );

  return { buttons, visible };
}

export function createOverlayViewModel(
  now: Date,
  result: OverlayCalculationResult,
  settings: ExtensionSettings,
  pendingAction: RecordAction | null,
): OverlayViewModel {
  return {
    headerBadge: createHeaderBadge(result),
    monthSection: createMonthSection(now, result, settings.seenBoxes),
    settings: {
      excludeNightWorkFromBank: settings.excludeNightWorkFromBank,
    },
    sidebar: createSidebarModel(result.todayBadgeStatus, pendingAction),
    todaySection: createTodaySection(now, result, settings.seenBoxes),
  };
}
