import type {
  OverlayMetricTone,
  TodayBadgeStatus,
} from "@/domain/kot/projection/overlay-metrics";
import type { WorkMode } from "@/domain/kot/types";

export type OverlayDurationMetricAppearance = "default" | "rest-day" | "subtle";

export type OverlayDurationMetric = {
  appearance: OverlayDurationMetricAppearance;
  cardTone: OverlayMetricTone;
  label: string;
  tone: OverlayMetricTone;
  unit: "" | "h" | "m";
  value: string;
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

export type OverlayModeSelectorOption = {
  ariaLabel: string;
  isActive: boolean;
  label: string;
  mode: WorkMode;
};

export type OverlayModeSelector = {
  ariaLabel: string;
  options: readonly OverlayModeSelectorOption[];
};

export type OverlaySectionModel = {
  badges: readonly OverlayBadge[];
  label: string;
  metrics: readonly OverlayDurationMetric[];
  modeSelector?: OverlayModeSelector;
};

export type OverlayViewModel = {
  headerBadge: OverlayHeaderBadge;
  monthSection: OverlaySectionModel;
  todaySection: OverlaySectionModel;
};
