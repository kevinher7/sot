import type {
  OverlayDurationMetric,
  OverlayProgressMetric,
  OverlayViewModel,
} from "./overlay";

const TODAY_MONTH_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
});

const TODAY_DAY_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  day: "2-digit",
});

function createDurationMetric(
  value: string,
  unit: "h" | "m",
  tone: OverlayDurationMetric["tone"],
): OverlayDurationMetric {
  return {
    value,
    unit,
    tone,
  };
}

function createProgressMetric(
  label: string,
  value: number,
): OverlayProgressMetric {
  return {
    label,
    value,
  };
}

function formatTodayLabel(now: Date): string {
  const month = TODAY_MONTH_FORMATTER.format(now);
  const day = TODAY_DAY_FORMATTER.format(now);

  return `TODAY ${month}${day}`;
}

export function createOverlayViewModel(now: Date): OverlayViewModel {
  return {
    todayLabel: formatTodayLabel(now),
    todayWorkLeft: createDurationMetric("--:--", "h", "negative"),
    todayBreakLeft: createDurationMetric("--", "m", "positive"),
    monthlyBank: createDurationMetric("--", "h", "positive"),
    monthlyProgress: createProgressMetric("Total", 0),
  };
}
