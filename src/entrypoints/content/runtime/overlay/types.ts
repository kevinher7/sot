import type {
  OverlayMetricTone,
  TodayBadgeStatus,
} from "@/domain/kot/projection/overlay-metrics";

export type OverlayDurationMetricAppearance = "default" | "rest-day";

export type OverlayDurationMetric = {
  appearance: OverlayDurationMetricAppearance;
  cardTone: OverlayMetricTone;
  tone: OverlayMetricTone;
  unit: "" | "h" | "m";
  value: string;
};

export type OverlayProgressMetric = {
  actualPercent: number;
  estimatedPercent: number;
  label: string;
  tone: OverlayMetricTone;
};

export type OverlayBadgeTone = "error" | "warning";

export type OverlayBadge = {
  countText: string;
  iconText: string;
  tone: OverlayBadgeTone;
};

export type OverlayHeaderBadge = {
  ariaLabel: string;
  text: string;
  title: string;
  tone: TodayBadgeStatus;
};

export type OverlayViewModel = {
  headerBadge: OverlayHeaderBadge;
  monthErrorBadges: readonly OverlayBadge[];
  monthlyBank: OverlayDurationMetric;
  monthLabel: string;
  monthlyProgress: OverlayProgressMetric;
  todayErrorBadges: readonly OverlayBadge[];
  todayBreakLeft: OverlayDurationMetric;
  todayLabel: string;
  todayWorkLeft: OverlayDurationMetric;
};
