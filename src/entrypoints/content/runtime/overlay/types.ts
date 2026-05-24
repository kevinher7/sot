import type {
  OverlayMetricTone,
  TodayBadgeStatus,
} from "@/domain/kot/projection/overlay-metrics";
import type { OverlayDurationMetricViewBinding } from "@/domain/kot/projection/overlay-mode/types";
import type { RecordAction } from "@/entrypoints/content/runtime/recorder/types";
import type { WorkMode } from "@/domain/kot/types";

export type OverlayDurationMetricAppearance = "default" | "rest-day" | "subtle";

export type OverlayDurationMetric = {
  appearance: OverlayDurationMetricAppearance;
  cardTone: OverlayMetricTone;
  label: string;
  showNewBadge: boolean;
  tone: OverlayMetricTone;
  unit: "" | "h" | "m";
  value: string;
  viewBinding: OverlayDurationMetricViewBinding | undefined;
};

export type OnSelectWorkMode = (mode: WorkMode) => void;
export type OnToggleMetricView = (
  binding: OverlayDurationMetricViewBinding,
) => void;

export type OnRecordAction = (action: RecordAction) => void;

export type OverlayRenderCallbacks = {
  onRecordAction: OnRecordAction;
  onSelectWorkMode: OnSelectWorkMode;
  onToggleMetricView: OnToggleMetricView;
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
  modeSelector: OverlayModeSelector | undefined;
};

export type SidebarButtonStatus =
  | "default"
  | "highlighted"
  | "dimmed"
  | "pending";

export type SidebarButtonModel = {
  action: RecordAction;
  label: string;
  status: SidebarButtonStatus;
};

export type SidebarModel = {
  buttons: readonly SidebarButtonModel[];
  visible: boolean;
};

export type OverlayViewModel = {
  headerBadge: OverlayHeaderBadge;
  monthSection: OverlaySectionModel;
  sidebar: SidebarModel;
  todaySection: OverlaySectionModel;
};
