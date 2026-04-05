import type {
  OverlayCalculationResult,
  OverlayCalculationSettings,
} from "../../domain/kot/overlay-calculations";
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
  appearance: OverlayDurationMetric["appearance"],
  value: string,
  unit: OverlayDurationMetric["unit"],
  tone: OverlayDurationMetric["tone"],
): OverlayDurationMetric {
  return {
    appearance,
    tone,
    unit,
    value,
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

function formatMonthLabel(now: Date): string {
  const month = TODAY_MONTH_FORMATTER.format(now);

  return `MONTH ${month}`;
}

function formatHoursAndMinutes(totalMinutes: number): string {
  const absoluteMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatSignedHoursAndMinutes(totalMinutes: number): string {
  const prefix = totalMinutes < 0 ? "-" : "+";
  return `${prefix}${formatHoursAndMinutes(totalMinutes)}`;
}

function formatMinutes(totalMinutes: number): string {
  return totalMinutes.toString();
}

function createTodayWorkMetric(
  result: OverlayCalculationResult,
  settings: OverlayCalculationSettings,
): OverlayDurationMetric {
  if (result.todayStatus === "rest-day") {
    return createDurationMetric("rest-day", "REST DAY", "", "neutral");
  }

  const remainingMinutes =
    result.todayStatus === "not-started"
      ? settings.standardWorkdayHours * 60
      : result.todayWorkLeftMinutes;

  return createDurationMetric(
    "default",
    formatHoursAndMinutes(remainingMinutes),
    "h",
    result.todayStatus === "not-started" ? "neutral" : "negative",
  );
}

function createTodayBreakMetric(
  result: OverlayCalculationResult,
  settings: OverlayCalculationSettings,
): OverlayDurationMetric {
  if (result.todayStatus === "rest-day") {
    return createDurationMetric("rest-day", "REST DAY", "", "neutral");
  }

  const remainingMinutes =
    result.todayStatus === "not-started"
      ? settings.standardBreakMinutes
      : result.todayBreakLeftMinutes;

  return createDurationMetric(
    "default",
    formatMinutes(remainingMinutes),
    "m",
    result.todayStatus === "not-started" ? "neutral" : "positive",
  );
}

function createMonthlyBankMetric(
  monthBankMinutes: number,
): OverlayDurationMetric {
  const tone: OverlayDurationMetric["tone"] =
    monthBankMinutes > 0
      ? "positive"
      : monthBankMinutes < 0
        ? "negative"
        : "neutral";

  return createDurationMetric(
    "default",
    formatSignedHoursAndMinutes(monthBankMinutes),
    "h",
    tone,
  );
}

export function createOverlayViewModel(
  now: Date,
  result: OverlayCalculationResult,
  settings: OverlayCalculationSettings,
): OverlayViewModel {
  return {
    monthlyBank: createMonthlyBankMetric(result.monthBankMinutes),
    monthLabel: formatMonthLabel(now),
    monthlyProgress: createProgressMetric("TOTAL", result.monthProgressPercent),
    todayBreakLeft: createTodayBreakMetric(result, settings),
    todayLabel: formatTodayLabel(now),
    todayWorkLeft: createTodayWorkMetric(result, settings),
  };
}
