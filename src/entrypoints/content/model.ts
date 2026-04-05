import type {
  OverlayCalculationResult,
  OverlayCalculationSettings,
} from "@/domain/kot/overlay-calculations";
import type {
  OverlayBadge,
  OverlayDurationMetric,
  OverlayProgressMetric,
  OverlayViewModel,
} from "./overlay-types";

const TODAY_MONTH_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
});

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
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
  cardTone: OverlayDurationMetric["cardTone"] = tone,
): OverlayDurationMetric {
  return {
    appearance,
    cardTone,
    tone,
    unit,
    value,
  };
}

function createProgressMetric(
  label: string,
  actualPercent: number,
  estimatedPercent: number,
  tone: OverlayProgressMetric["tone"],
): OverlayProgressMetric {
  return {
    actualPercent,
    estimatedPercent,
    label,
    tone,
  };
}

function formatTodayLabel(now: Date): string {
  const month = TODAY_MONTH_FORMATTER.format(now);
  const day = TODAY_DAY_FORMATTER.format(now);

  return `TODAY ${month}${day}`;
}

function formatMonthLabel(now: Date): string {
  const month = MONTH_LABEL_FORMATTER.format(now);

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
  result: OverlayCalculationResult,
): OverlayDurationMetric {
  const valueTone =
    result.monthBankMinutes > 0
      ? "positive"
      : result.monthBankMinutes < 0
        ? "negative"
        : "neutral";

  return createDurationMetric(
    "default",
    formatSignedHoursAndMinutes(result.monthBankMinutes),
    "h",
    valueTone,
    result.bankTone,
  );
}

function createMonthErrorBadges(
  errorDayCount: number,
  warningDayCount: number,
): OverlayBadge[] {
  const badges: OverlayBadge[] = [];

  if (errorDayCount > 0) {
    badges.push({
      countText: errorDayCount.toString(),
      iconText: "⚠",
      tone: "error",
    });
  }

  if (warningDayCount > 0) {
    badges.push({
      countText: warningDayCount.toString(),
      iconText: "⚠",
      tone: "warning",
    });
  }

  return badges;
}

export function createOverlayViewModel(
  now: Date,
  result: OverlayCalculationResult,
  settings: OverlayCalculationSettings,
): OverlayViewModel {
  return {
    monthErrorBadges: createMonthErrorBadges(
      result.errorDayCount,
      result.warningDayCount,
    ),
    monthlyBank: createMonthlyBankMetric(result),
    monthLabel: formatMonthLabel(now),
    monthlyProgress: createProgressMetric(
      "TOTAL",
      result.monthActualProgressPercent,
      result.monthEstimatedProgressPercent,
      result.progressTone,
    ),
    todayBreakLeft: createTodayBreakMetric(result, settings),
    todayLabel: formatTodayLabel(now),
    todayWorkLeft: createTodayWorkMetric(result, settings),
  };
}
