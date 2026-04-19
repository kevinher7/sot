import {
  calculateKotDay,
  createKotResolveDayContext,
} from "@/domain/kot/calculation/day/day-calculator";
import { buildEffectiveDayScenario } from "@/domain/kot/calculation/day/scenario-builders";
import type { KotResolvedMonth } from "@/domain/kot/calculation/month/month-types";
import { resolveKotMonth } from "@/domain/kot/calculation/month/month-resolver";
import { getKotPendingRequestsForDate } from "@/domain/kot/calculation/requests/request-scenario";
import { createKotPendingRequestMap } from "@/domain/kot/calculation/requests/request-simulation";
import { createIsoDateKey } from "@/domain/kot/date";
import type { KotMonthlyPageSnapshot } from "@/domain/kot/monthly-page-types";
import type { KotRequestCacheEntry } from "@/domain/kot/request-data";
import { projectFullOverlayMode } from "@/domain/kot/projection/overlay-mode/full";
import { projectInternOverlayMode } from "@/domain/kot/projection/overlay-mode/intern";
import type {
  OverlayModeProjectionInput,
  OverlayModeProjectionResult,
} from "@/domain/kot/projection/overlay-mode/types";
import type { ExtensionSettings } from "@/domain/kot/types";

export type OverlayMetricTone =
  | "positive"
  | "negative"
  | "neutral"
  | "warning"
  | "error";

export type OverlayCalculationSettings = Pick<
  ExtensionSettings,
  "standardBreakMinutes" | "standardWorkdayHours" | "workMode"
>;

export type OverlayCalculationInput = {
  now: Date;
  pageSnapshot: KotMonthlyPageSnapshot;
  requestCacheEntry: KotRequestCacheEntry | null;
  settings: OverlayCalculationSettings;
};

export type TodayStatus = "in-progress" | "rest-day" | "not-started";

export type TodayBadgeStatus =
  | "break"
  | "finished"
  | "in-progress"
  | "not-started"
  | "rest-day";

export type OverlayCalculationResult = OverlayModeProjectionResult & {
  monthErrorCount: number;
  monthWarningCount: number;
  todayBadgeStatus: TodayBadgeStatus;
  todayErrorCount: number;
  todayWarningCount: number;
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
  resolvedMonth: KotResolvedMonth,
): number {
  return (
    resolvedMonth.todayDay?.effective.calculatedDay.interpretation
      .workedMinutesDisplay ?? 0
  );
}

export function calculateTodayBreakMinutes(
  resolvedMonth: KotResolvedMonth,
): number {
  return (
    resolvedMonth.todayDay?.effective.calculatedDay.interpretation
      .breakMinutesDisplay ?? 0
  );
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

export function calculateTodayBadgeStatus(input: {
  now: Date;
  pageSnapshot: KotMonthlyPageSnapshot;
  requestCacheEntry: KotRequestCacheEntry | null;
}): TodayBadgeStatus {
  const todayRow = input.pageSnapshot.todayRow;

  if (!todayRow) {
    return "rest-day";
  }

  const requestMap = createKotPendingRequestMap(input.requestCacheEntry);
  const pendingRequests = getKotPendingRequestsForDate(
    requestMap,
    todayRow.isoDate,
  );
  const effectiveScenario = buildEffectiveDayScenario(
    todayRow,
    pendingRequests,
  );

  if (effectiveScenario.interpretedRow.dayKind === "offday") {
    return "rest-day";
  }

  const effectiveDay = calculateKotDay(
    effectiveScenario,
    createKotResolveDayContext(input.now),
  );

  if (effectiveDay.issues.issueCodes.includes("ongoingBreak")) {
    return "break";
  }

  if (effectiveScenario.interpretedRow.clockInMinutes === null) {
    return "not-started";
  }

  if (effectiveScenario.interpretedRow.clockOutMinutes !== null) {
    return "finished";
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
  breakAllowanceMinutes: number,
): number {
  return todayBreakMinutes - breakAllowanceMinutes;
}

export function calculateTodayBreakAllowanceMinutes(
  todayWorkedMinutes: number,
  settings: OverlayCalculationSettings,
): number {
  if (settings.workMode === "intern") {
    if (todayWorkedMinutes < 6 * 60) {
      return 0;
    }

    if (todayWorkedMinutes < 8 * 60) {
      return 45;
    }

    return 60;
  }

  return settings.standardBreakMinutes;
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

function calculateAggregateTone(input: {
  displayMinutes: number;
  errorDayCount: number;
  isUsingEstimate: boolean;
}): OverlayMetricTone {
  if (input.errorDayCount > 0) {
    return "negative";
  }

  if (input.isUsingEstimate) {
    return "warning";
  }

  if (input.displayMinutes > 0) {
    return "positive";
  }

  if (input.displayMinutes < 0) {
    return "negative";
  }

  return "neutral";
}

function normalizeTodayStatus(
  todayStatus: TodayStatus,
  settings: OverlayCalculationSettings,
  pageSnapshot: KotMonthlyPageSnapshot,
): TodayStatus {
  if (
    todayStatus === "rest-day" &&
    settings.workMode === "intern" &&
    pageSnapshot.todayRow?.dayKind === "offday"
  ) {
    return "not-started";
  }

  return todayStatus;
}

function normalizeTodayBadgeStatus(
  todayBadgeStatus: TodayBadgeStatus,
  settings: OverlayCalculationSettings,
  pageSnapshot: KotMonthlyPageSnapshot,
): TodayBadgeStatus {
  if (
    todayBadgeStatus === "rest-day" &&
    settings.workMode === "intern" &&
    pageSnapshot.todayRow?.dayKind === "offday"
  ) {
    return "not-started";
  }

  return todayBadgeStatus;
}

function createModeProjectionInput(
  input: OverlayCalculationInput,
  resolvedMonth: KotResolvedMonth,
): OverlayModeProjectionInput {
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
  const todayBreakAllowanceMinutes = calculateTodayBreakAllowanceMinutes(
    todayWorkedMinutes,
    input.settings,
  );
  const monthBankMinutes = calculateMonthBankMinutes(
    resolvedMonth.effectiveSummary.bankMinutesSoFar,
    requiredWorkedMinutesSoFar,
  );
  const todayStatus = normalizeTodayStatus(
    calculateTodayStatus(input.pageSnapshot),
    input.settings,
    input.pageSnapshot,
  );
  const todayBadgeStatus = normalizeTodayBadgeStatus(
    calculateTodayBadgeStatus({
      now: input.now,
      pageSnapshot: input.pageSnapshot,
      requestCacheEntry: input.requestCacheEntry,
    }),
    input.settings,
    input.pageSnapshot,
  );

  return {
    monthBankMinutes,
    monthBankTone: calculateAggregateTone({
      displayMinutes: monthBankMinutes,
      errorDayCount: resolvedMonth.aggregateFlags.errorDayCount,
      isUsingEstimate: resolvedMonth.aggregateFlags.isUsingEstimate,
    }),
    monthProgressActualPercent: calculateMonthProgressPercent(
      resolvedMonth.actualSummary.bankMinutesSoFar,
      requiredWorkedMinutesInMonth,
    ),
    monthProgressEstimatedPercent: calculateMonthProgressPercent(
      resolvedMonth.effectiveSummary.bankMinutesSoFar,
      requiredWorkedMinutesInMonth,
    ),
    monthWorkedCardTone: calculateAggregateTone({
      displayMinutes: resolvedMonth.effectiveSummary.workedMinutesSoFar,
      errorDayCount: resolvedMonth.aggregateFlags.errorDayCount,
      isUsingEstimate: resolvedMonth.aggregateFlags.isUsingEstimate,
    }),
    requiredWorkdayMinutes: input.settings.standardWorkdayHours * 60,
    resolvedMonth,
    todayBadgeStatus,
    todayBreakAllowanceMinutes,
    todayBreakDiffMinutes: calculateTodayBreakDiffMinutes(
      todayBreakMinutes,
      todayBreakAllowanceMinutes,
    ),
    todayBreakMetricCardTone:
      (resolvedMonth.todayDay?.effective.calculatedDay.issues.errorCount ?? 0) >
      0
        ? "error"
        : "neutral",
    todayBreakMinutes,
    todayErrorCount:
      resolvedMonth.todayDay?.effective.calculatedDay.issues.errorCount ?? 0,
    todayStatus,
    todayWorkedMinutes,
    todayWorkDiffMinutes: calculateTodayWorkDiffMinutes(
      todayWorkedMinutes,
      input.settings,
    ),
  };
}

export function calculateOverlayMetrics(
  input: OverlayCalculationInput,
): OverlayCalculationResult {
  const resolvedMonth = resolveKotMonth({
    now: input.now,
    pageSnapshot: input.pageSnapshot,
    requestCacheEntry: input.requestCacheEntry,
  });
  const projectionInput = createModeProjectionInput(input, resolvedMonth);
  const modeResult =
    input.settings.workMode === "intern"
      ? projectInternOverlayMode(projectionInput)
      : projectFullOverlayMode(projectionInput);

  return {
    ...modeResult,
    monthErrorCount: resolvedMonth.aggregateFlags.errorDayCount,
    monthWarningCount: resolvedMonth.aggregateFlags.warningDayCount,
    todayBadgeStatus: projectionInput.todayBadgeStatus,
    todayErrorCount: projectionInput.todayErrorCount,
    todayWarningCount:
      resolvedMonth.todayDay?.effective.calculatedDay.issues.warningCount ?? 0,
  };
}
