export type WorkMode = "full" | "intern";

export type WorkTodayView = "left" | "elapsed";
export type BreakTodayView = "left" | "elapsed";
export type MonthBankView = "actual" | "estimated";

export type MetricViewKey = "workToday" | "breakToday" | "monthBank";

export type ExtensionMetricViews = {
  workToday: WorkTodayView;
  breakToday: BreakTodayView;
  monthBank: MonthBankView;
};

export type SeenBoxes = Record<MetricViewKey, boolean>;

export type ExtensionSettings = {
  standardBreakMinutes: number;
  standardWorkdayHours: number;
  workMode: WorkMode;
  metricViews: ExtensionMetricViews;
  seenBoxes: SeenBoxes;
};
