import type { KotResolvedMonth } from "@/domain/kot/calculation/month/month-types";
import type {
  OverlayMetricTone,
  TodayBadgeStatus,
  TodayStatus,
} from "@/domain/kot/projection/overlay-metrics";
import type {
  BreakTodayView,
  ExtensionMetricViews,
  MonthBankView,
  WorkMode,
  WorkTodayView,
} from "@/domain/kot/types";

export type OverlayMetricAppearance = "default" | "rest-day" | "subtle";
export type OverlayMetricFormat = "signed-duration" | "unsigned-duration";

export type OverlayDurationMetricViewBinding =
  | { viewKey: "workToday"; nextView: WorkTodayView }
  | { viewKey: "breakToday"; nextView: BreakTodayView }
  | { viewKey: "monthBank"; nextView: MonthBankView };

export type OverlayDurationMetricProjection = {
  appearance: OverlayMetricAppearance;
  cardTone: OverlayMetricTone;
  format: OverlayMetricFormat;
  label: string;
  minutes: number;
  tone: OverlayMetricTone;
  unit: "" | "h";
  viewBinding: OverlayDurationMetricViewBinding | undefined;
};

export type OverlayModeProjectionResult = {
  monthPrimaryMetric: OverlayDurationMetricProjection;
  todayPrimaryMetric: OverlayDurationMetricProjection;
  todaySecondaryMetric: OverlayDurationMetricProjection;
  workMode: WorkMode;
};

export type OverlayModeProjectionInput = {
  metricViews: ExtensionMetricViews;
  monthBankEstimatedMinutes: number;
  monthBankMinutes: number;
  monthBankTone: OverlayMetricTone;
  monthWorkedCardTone: OverlayMetricTone;
  requiredWorkdayMinutes: number;
  resolvedMonth: KotResolvedMonth;
  todayBadgeStatus: TodayBadgeStatus;
  todayBreakAllowanceMinutes: number;
  todayBreakDiffMinutes: number;
  todayBreakMinutes: number;
  todayBreakMetricCardTone: OverlayMetricTone;
  todayErrorCount: number;
  todayStatus: TodayStatus;
  todayWorkedMinutes: number;
  todayWorkDiffMinutes: number;
};
