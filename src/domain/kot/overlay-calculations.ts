import type { KotRequestCacheEntry, KotRequestTimePatch } from "./request-data";
import type { ExtensionSettings } from "./types";
import { deriveWorkedMinutes } from "./worked-minutes";

export type KotDayKind = "workday" | "offday";
export type KotDayResolution = "normal" | "warning" | "error";
export type OverlayMetricTone = "positive" | "negative" | "neutral" | "warning";

export type KotDayRowSnapshot = {
  breakEndMinutes: readonly number[];
  breakMinutes: number;
  breakStartMinutes: readonly number[];
  clockInMinutes: number | null;
  clockOutMinutes: number | null;
  day: number;
  dayKind: KotDayKind;
  hasError: boolean;
  hasRequestMarker: boolean;
  hasClockIn: boolean;
  hasClockOut: boolean;
  isoDate: string;
  workedMinutes: number;
};

export type KotMonthlyPageSnapshot = {
  actualWorkedMinutesSoFar: number;
  month: number;
  rows: readonly KotDayRowSnapshot[];
  signature: string;
  todayRow: KotDayRowSnapshot | null;
  year: number;
};

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
  monthBankMinutes: number;
  monthProgressPercent: number;
  progressTone: OverlayMetricTone;
  requiredWorkedMinutesSoFar: number;
  todayBreakLeftMinutes: number;
  todayBreakMinutes: number;
  todayStatus: TodayStatus;
  todayWorkedMinutes: number;
  todayWorkLeftMinutes: number;
  warningDayCount: number;
};

type DayEstimateOutcome = {
  effectiveWorkedMinutes: number;
  resolution: KotDayResolution;
  usesEstimate: boolean;
};

function createDateKey(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createRequestMap(
  requestCacheEntry: KotRequestCacheEntry | null,
): ReadonlyMap<string, readonly KotRequestTimePatch[]> {
  const grouped = new Map<string, KotRequestTimePatch[]>();

  requestCacheEntry?.requests.forEach((request) => {
    if (request.status !== "pending") {
      return;
    }

    const existing = grouped.get(request.isoDate) ?? [];
    existing.push(request.timePatch);
    grouped.set(request.isoDate, existing);
  });

  return grouped;
}

function areMinuteListsEqual(
  left: readonly number[] | undefined,
  right: readonly number[] | undefined,
): boolean {
  if (left === undefined || right === undefined) {
    return left === right;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function mergeTimePatches(
  patches: readonly KotRequestTimePatch[],
): KotRequestTimePatch | null {
  let clockInMinutes: number | undefined;
  let clockOutMinutes: number | undefined;
  let breakStartMinutes: readonly number[] | undefined;
  let breakEndMinutes: readonly number[] | undefined;

  for (const patch of patches) {
    if (patch.clockInMinutes !== undefined) {
      if (
        clockInMinutes !== undefined &&
        clockInMinutes !== patch.clockInMinutes
      ) {
        return null;
      }

      clockInMinutes = patch.clockInMinutes;
    }

    if (patch.clockOutMinutes !== undefined) {
      if (
        clockOutMinutes !== undefined &&
        clockOutMinutes !== patch.clockOutMinutes
      ) {
        return null;
      }

      clockOutMinutes = patch.clockOutMinutes;
    }

    if (patch.breakStartMinutes !== undefined) {
      if (
        breakStartMinutes !== undefined &&
        !areMinuteListsEqual(breakStartMinutes, patch.breakStartMinutes)
      ) {
        return null;
      }

      breakStartMinutes = patch.breakStartMinutes;
    }

    if (patch.breakEndMinutes !== undefined) {
      if (
        breakEndMinutes !== undefined &&
        !areMinuteListsEqual(breakEndMinutes, patch.breakEndMinutes)
      ) {
        return null;
      }

      breakEndMinutes = patch.breakEndMinutes;
    }
  }

  return {
    breakEndMinutes,
    breakStartMinutes,
    clockInMinutes,
    clockOutMinutes,
  };
}

function resolveDayEstimate(
  row: KotDayRowSnapshot,
  now: Date,
  patches: readonly KotRequestTimePatch[] | undefined,
): DayEstimateOutcome {
  if (!row.hasError) {
    return {
      effectiveWorkedMinutes: row.workedMinutes,
      resolution: "normal",
      usesEstimate: false,
    };
  }

  if (patches === undefined || patches.length === 0) {
    return {
      effectiveWorkedMinutes: row.workedMinutes,
      resolution: "error",
      usesEstimate: false,
    };
  }

  const mergedPatch = mergeTimePatches(patches);

  if (mergedPatch === null) {
    return {
      effectiveWorkedMinutes: row.workedMinutes,
      resolution: "error",
      usesEstimate: false,
    };
  }

  const derived = deriveWorkedMinutes({
    breakEndMinutes: mergedPatch.breakEndMinutes ?? row.breakEndMinutes,
    breakStartMinutes: mergedPatch.breakStartMinutes ?? row.breakStartMinutes,
    clockInMinutes: mergedPatch.clockInMinutes ?? row.clockInMinutes,
    clockOutMinutes: mergedPatch.clockOutMinutes ?? row.clockOutMinutes,
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
    treatIncompleteAsOngoing: row.isoDate === createDateKey(now),
  });

  if (derived === null) {
    return {
      effectiveWorkedMinutes: row.workedMinutes,
      resolution: "error",
      usesEstimate: false,
    };
  }

  return {
    effectiveWorkedMinutes: derived.workedMinutes,
    resolution: "warning",
    usesEstimate: true,
  };
}

export function calculateRequiredElapsedWorkdays(
  now: Date,
  pageSnapshot: KotMonthlyPageSnapshot,
): number {
  const todayDate = createDateKey(now);

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

export function calculateTodayWorkedMinutes(
  pageSnapshot: KotMonthlyPageSnapshot,
): number {
  return pageSnapshot.todayRow?.workedMinutes ?? 0;
}

export function calculateTodayBreakMinutes(
  pageSnapshot: KotMonthlyPageSnapshot,
): number {
  return pageSnapshot.todayRow?.breakMinutes ?? 0;
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

export function calculateTodayWorkLeftMinutes(
  todayWorkedMinutes: number,
  settings: OverlayCalculationSettings,
): number {
  return Math.max(settings.standardWorkdayHours * 60 - todayWorkedMinutes, 0);
}

export function calculateTodayBreakLeftMinutes(
  todayBreakMinutes: number,
  settings: OverlayCalculationSettings,
): number {
  return Math.max(settings.standardBreakMinutes - todayBreakMinutes, 0);
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
  const elapsedWorkdays = calculateRequiredElapsedWorkdays(
    input.now,
    input.pageSnapshot,
  );
  const requiredWorkedMinutesSoFar = calculateRequiredWorkedMinutesSoFar(
    elapsedWorkdays,
    input.settings,
  );
  const todayWorkedMinutes = calculateTodayWorkedMinutes(input.pageSnapshot);
  const todayBreakMinutes = calculateTodayBreakMinutes(input.pageSnapshot);
  const todayDate = createDateKey(input.now);
  const requestMap = createRequestMap(input.requestCacheEntry);

  let displayWorkedMinutesSoFar = 0;
  let errorDayCount = 0;
  let warningDayCount = 0;
  let isUsingEstimate = false;

  input.pageSnapshot.rows.forEach((row) => {
    if (row.isoDate > todayDate) {
      return;
    }

    const outcome = resolveDayEstimate(
      row,
      input.now,
      requestMap.get(row.isoDate),
    );

    displayWorkedMinutesSoFar += outcome.effectiveWorkedMinutes;

    if (outcome.resolution === "error") {
      errorDayCount += 1;
    }

    if (outcome.resolution === "warning") {
      warningDayCount += 1;
      isUsingEstimate = true;
    }
  });

  const actualBankMinutes = calculateMonthBankMinutes(
    input.pageSnapshot.actualWorkedMinutesSoFar,
    requiredWorkedMinutesSoFar,
  );
  const monthBankMinutes = calculateMonthBankMinutes(
    displayWorkedMinutesSoFar,
    requiredWorkedMinutesSoFar,
  );
  const bankTone = calculateBankTone(
    monthBankMinutes,
    errorDayCount,
    isUsingEstimate,
  );

  return {
    actualBankMinutes,
    actualWorkedMinutesSoFar: input.pageSnapshot.actualWorkedMinutesSoFar,
    bankTone,
    displayWorkedMinutesSoFar,
    errorDayCount,
    isUsingEstimate,
    monthBankMinutes,
    monthProgressPercent: calculateMonthProgressPercent(
      displayWorkedMinutesSoFar,
      requiredWorkedMinutesSoFar,
    ),
    progressTone: bankTone,
    requiredWorkedMinutesSoFar,
    todayBreakLeftMinutes: calculateTodayBreakLeftMinutes(
      todayBreakMinutes,
      input.settings,
    ),
    todayBreakMinutes,
    todayStatus: calculateTodayStatus(input.pageSnapshot),
    todayWorkedMinutes,
    todayWorkLeftMinutes: calculateTodayWorkLeftMinutes(
      todayWorkedMinutes,
      input.settings,
    ),
    warningDayCount,
  };
}
