import type { OverlayMetricTone } from "@/domain/kot/overlay-calculations";

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

export type OverlayViewModel = {
  monthErrorBadges: readonly OverlayBadge[];
  monthlyBank: OverlayDurationMetric;
  monthLabel: string;
  monthlyProgress: OverlayProgressMetric;
  todayErrorBadges: readonly OverlayBadge[];
  todayBreakLeft: OverlayDurationMetric;
  todayLabel: string;
  todayWorkLeft: OverlayDurationMetric;
};
