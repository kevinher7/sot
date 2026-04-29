import type {
  BreakTodayView,
  ExtensionMetricViews,
  ExtensionSettings,
  MonthBankView,
  WorkMode,
  WorkTodayView,
} from "@/domain/kot/types";

function normalizeWorkMode(workMode: string | undefined): WorkMode {
  return workMode === "intern" ? "intern" : "full";
}

function normalizeWorkTodayView(value: string | undefined): WorkTodayView {
  return value === "elapsed" ? "elapsed" : "left";
}

function normalizeBreakTodayView(value: string | undefined): BreakTodayView {
  return value === "elapsed" ? "elapsed" : "left";
}

function normalizeMonthBankView(value: string | undefined): MonthBankView {
  return value === "estimated" ? "estimated" : "actual";
}

function normalizeMetricViews(
  metricViews: Partial<ExtensionMetricViews> | undefined,
): ExtensionMetricViews {
  return {
    workToday: normalizeWorkTodayView(metricViews?.workToday),
    breakToday: normalizeBreakTodayView(metricViews?.breakToday),
    monthBank: normalizeMonthBankView(metricViews?.monthBank),
  };
}

export const DEFAULT_METRIC_VIEWS: ExtensionMetricViews = {
  workToday: "left",
  breakToday: "left",
  monthBank: "actual",
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  standardBreakMinutes: 60,
  standardWorkdayHours: 8,
  workMode: "full",
  metricViews: DEFAULT_METRIC_VIEWS,
};

export function normalizeSettings(
  settings: Partial<ExtensionSettings> | undefined,
): ExtensionSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    workMode: normalizeWorkMode(settings?.workMode),
    metricViews: normalizeMetricViews(settings?.metricViews),
  };
}
