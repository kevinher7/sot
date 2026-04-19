import type { KotResolvedMonth } from "@/domain/kot/calculation/month/month-types";
import type {
  OverlayMetricTone,
  TodayBadgeStatus,
  TodayStatus,
} from "@/domain/kot/projection/overlay-metrics";
import type { WorkMode } from "@/domain/kot/types";

export type OverlayMetricAppearance = "default" | "rest-day" | "subtle";
export type OverlayMetricFormat = "signed-duration" | "unsigned-duration";

export type OverlayDurationMetricProjection = {
  appearance: OverlayMetricAppearance;
  cardTone: OverlayMetricTone;
  format: OverlayMetricFormat;
  label: string;
  minutes: number;
  tone: OverlayMetricTone;
  unit: "" | "h";
};

export type OverlayProgressMetricProjection = {
  actualPercent: number;
  estimatedPercent: number;
  label: string;
  tone: OverlayMetricTone;
};

export type OverlayModeProjectionResult = {
  monthPrimaryMetric: OverlayDurationMetricProjection;
  monthProgressMetric: OverlayProgressMetricProjection | null;
  todayPrimaryMetric: OverlayDurationMetricProjection;
  todaySecondaryMetric: OverlayDurationMetricProjection;
  workMode: WorkMode;
};

export type OverlayModeProjectionInput = {
  monthBankMinutes: number;
  monthBankTone: OverlayMetricTone;
  monthProgressActualPercent: number;
  monthProgressEstimatedPercent: number;
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
