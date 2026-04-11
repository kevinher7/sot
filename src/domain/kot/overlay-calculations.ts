import { createIsoDateKey } from "@/domain/kot/date";
import type { KotMonthlyPageSnapshot } from "@/domain/kot/monthly-page-types";
import type { KotRequestCacheEntry } from "@/domain/kot/request-data";
import type { ExtensionSettings } from "@/domain/kot/types";
import { resolveKotMonth } from "@/domain/kot/work-time/month-resolution";

export type OverlayMetricTone =
  | "positive"
  | "negative"
  | "neutral"
  | "warning"
  | "error";

export type OverlayCalculationSettings = Pick<
  ExtensionSettings,
  "standardBreakMinutes" | "standardWorkdayHours"
>;

export type OverlayCalculationInput = {
  now: Date;
  pageSnapshot: KotMonthlyPageSnapshot;
  requestCacheEntry: KotRequestCacheEntry | null;
  settings: OverlayCalculationSettings;
};

export type TodayStatus = "in-progress" | "rest-day" | "not-started";

export type OverlayCalculationResult = {
  actualBankMinutes: number;
  actualWorkedMinutesSoFar: number;
  bankTone: OverlayMetricTone;
  displayWorkedMinutesSoFar: number;
  errorDayCount: number;
  isUsingEstimate: boolean;
  monthActualProgressPercent: number;
  monthBankMinutes: number;
  monthEstimatedProgressPercent: number;
  progressTone: OverlayMetricTone;
  requiredWorkedMinutesSoFar: number;
  todayBreakDiffMinutes: number;
  todayBreakMinutes: number;
  todayErrorCount: number;
  todayStatus: TodayStatus;
  todayWorkedMinutes: number;
  todayWorkDiffMinutes: number;
  todayWarningCount: number;
  warningDayCount: number;
};

export function calculateRequiredElapsedWorkdays(
  now: Date,
  pageSnapshot: KotMonthlyPageSnapshot,
): number {
  const todayDate = createIsoDateKey(now);

  return pageSnapshot.rows.filter(
    (row) => row.dayKind === "workday" && row.isoDate <= todayDate,
  ).length;
}

export function calculateRequiredWorkedMinutesSoFar(
  elapsedWorkdays: number,
  settings: OverlayCalculationSettings,
): number {
  return elapsedWorkdays * settings.standardWorkdayHours * 60;
}

function calculateRequiredWorkedMinutesInMonth(
  pageSnapshot: KotMonthlyPageSnapshot,
  settings: OverlayCalculationSettings,
): number {
  const totalWorkdays = pageSnapshot.rows.filter(
    (row) => row.dayKind === "workday",
  ).length;

  return totalWorkdays * settings.standardWorkdayHours * 60;
}

export function calculateTodayWorkedMinutes(
  resolvedMonth: ReturnType<typeof resolveKotMonth>,
): number {
  return resolvedMonth.todayDay?.effective.workedMinutesDisplay ?? 0;
}

export function calculateTodayBreakMinutes(
  resolvedMonth: ReturnType<typeof resolveKotMonth>,
): number {
  return resolvedMonth.todayDay?.effective.breakMinutes ?? 0;
}

export function calculateTodayStatus(
  pageSnapshot: KotMonthlyPageSnapshot,
): TodayStatus {
  const todayRow = pageSnapshot.todayRow;

  if (!todayRow) {
    return "rest-day";
  }

  if (!todayRow.hasClockIn) {
    return todayRow.dayKind === "offday" ? "rest-day" : "not-started";
  }

  return "in-progress";
}

export function calculateTodayWorkDiffMinutes(
  todayWorkedMinutes: number,
  settings: OverlayCalculationSettings,
): number {
  return todayWorkedMinutes - settings.standardWorkdayHours * 60;
}

export function calculateTodayBreakDiffMinutes(
  todayBreakMinutes: number,
  settings: OverlayCalculationSettings,
): number {
  return todayBreakMinutes - settings.standardBreakMinutes;
}

export function calculateMonthBankMinutes(
  workedMinutesSoFar: number,
  requiredWorkedMinutesSoFar: number,
): number {
  return workedMinutesSoFar - requiredWorkedMinutesSoFar;
}

export function calculateMonthProgressPercent(
  workedMinutesSoFar: number,
  requiredWorkedMinutesSoFar: number,
): number {
  if (requiredWorkedMinutesSoFar <= 0) {
    return 0;
  }

  return (workedMinutesSoFar / requiredWorkedMinutesSoFar) * 100;
}

function calculateBankTone(
  displayBankMinutes: number,
  errorDayCount: number,
  isUsingEstimate: boolean,
): OverlayMetricTone {
  if (errorDayCount > 0) {
    return "negative";
  }

  if (isUsingEstimate) {
    return "warning";
  }

  if (displayBankMinutes > 0) {
    return "positive";
  }

  if (displayBankMinutes < 0) {
    return "negative";
  }

  return "neutral";
}

export function calculateOverlayMetrics(
  input: OverlayCalculationInput,
): OverlayCalculationResult {
  const resolvedMonth = resolveKotMonth({
    now: input.now,
    pageSnapshot: input.pageSnapshot,
    requestCacheEntry: input.requestCacheEntry,
  });
  const elapsedWorkdays = calculateRequiredElapsedWorkdays(
    input.now,
    input.pageSnapshot,
  );
  const requiredWorkedMinutesSoFar = calculateRequiredWorkedMinutesSoFar(
    elapsedWorkdays,
    input.settings,
  );
  const requiredWorkedMinutesInMonth = calculateRequiredWorkedMinutesInMonth(
    input.pageSnapshot,
    input.settings,
  );
  const todayWorkedMinutes = calculateTodayWorkedMinutes(resolvedMonth);
  const todayBreakMinutes = calculateTodayBreakMinutes(resolvedMonth);

  const actualBankMinutes = calculateMonthBankMinutes(
    resolvedMonth.actualWorkedMinutesSoFar,
    requiredWorkedMinutesSoFar,
  );
  const monthBankMinutes = calculateMonthBankMinutes(
    resolvedMonth.displayWorkedMinutesSoFar,
    requiredWorkedMinutesSoFar,
  );
  const bankTone = calculateBankTone(
    monthBankMinutes,
    resolvedMonth.errorDayCount,
    resolvedMonth.isUsingEstimate,
  );

  return {
    actualBankMinutes,
    actualWorkedMinutesSoFar: resolvedMonth.actualWorkedMinutesSoFar,
    bankTone,
    displayWorkedMinutesSoFar: resolvedMonth.displayWorkedMinutesSoFar,
    errorDayCount: resolvedMonth.errorDayCount,
    isUsingEstimate: resolvedMonth.isUsingEstimate,
    monthActualProgressPercent: calculateMonthProgressPercent(
      resolvedMonth.actualWorkedMinutesSoFar,
      requiredWorkedMinutesInMonth,
    ),
    monthBankMinutes,
    monthEstimatedProgressPercent: calculateMonthProgressPercent(
      resolvedMonth.displayWorkedMinutesSoFar,
      requiredWorkedMinutesInMonth,
    ),
    progressTone: bankTone,
    requiredWorkedMinutesSoFar,
    todayBreakDiffMinutes: calculateTodayBreakDiffMinutes(
      todayBreakMinutes,
      input.settings,
    ),
    todayBreakMinutes,
    todayErrorCount: resolvedMonth.todayDay?.effective.errorCount ?? 0,
    todayStatus: calculateTodayStatus(input.pageSnapshot),
    todayWorkedMinutes,
    todayWorkDiffMinutes: calculateTodayWorkDiffMinutes(
      todayWorkedMinutes,
      input.settings,
    ),
    todayWarningCount: resolvedMonth.todayDay?.effective.warningCount ?? 0,
    warningDayCount: resolvedMonth.warningDayCount,
  };
}
