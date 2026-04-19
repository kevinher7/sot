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

export type OverlayToggleAction = {
  ariaLabel: string;
  currentMode: WorkMode;
  text: string;
};

export type OverlaySectionModel = {
  badges: readonly OverlayBadge[];
  label: string;
  metrics: readonly OverlayDurationMetric[];
  progressMetric: OverlayProgressMetric | null;
  toggleAction?: OverlayToggleAction;
};

export type OverlayViewModel = {
  headerBadge: OverlayHeaderBadge;
  monthSection: OverlaySectionModel;
  todaySection: OverlaySectionModel;
};
