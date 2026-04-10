import { createIsoDateKey } from "./date";
import type {
  KotDayResolution,
  KotDayRowSnapshot,
  KotMonthlyPageSnapshot,
} from "./monthly-page-types";
import type {
  KotRequestCacheEntry,
  KotRequestOperation,
  KotTimeCorrectionRequest,
} from "./request-data";
import type { ExtensionSettings } from "./types";
import { deriveWorkedMinutes } from "./worked-minutes";

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

type DayEstimateOutcome = {
  effectiveWorkedMinutes: number;
  resolution: KotDayResolution;
  usesEstimate: boolean;
};

function createRequestMap(
  requestCacheEntry: KotRequestCacheEntry | null,
): ReadonlyMap<string, readonly KotTimeCorrectionRequest[]> {
  const grouped = new Map<string, KotTimeCorrectionRequest[]>();

  requestCacheEntry?.requests.forEach((request) => {
    if (request.status !== "pending") {
      return;
    }

    const existing = grouped.get(request.isoDate) ?? [];

    existing.push(request);
    grouped.set(request.isoDate, existing);
  });

  return grouped;
}

type SimulatedDayRow = {
  breakEndMinutes: number[];
  breakStartMinutes: number[];
  clockInMinutes: number | null;
  clockOutMinutes: number | null;
};

type RequestFieldKey = "clockIn" | "clockOut" | "breakStart" | "breakEnd";

function createSimulatedDayRow(row: KotDayRowSnapshot): SimulatedDayRow {
  return {
    breakEndMinutes: [...row.breakEndMinutes],
    breakStartMinutes: [...row.breakStartMinutes],
    clockInMinutes: row.clockInMinutes,
    clockOutMinutes: row.clockOutMinutes,
  };
}

function createCompatibilityKey(
  operation: KotRequestOperation,
  field: RequestFieldKey,
): string {
  if (operation.type === "delete") {
    return `delete:${operation.minutes}`;
  }

  if (field === "clockIn") {
    return `patch:${operation.timePatch.clockInMinutes ?? "-"}`;
  }

  if (field === "clockOut") {
    return `patch:${operation.timePatch.clockOutMinutes ?? "-"}`;
  }

  if (field === "breakStart") {
    return `patch:${operation.timePatch.breakStartMinutes?.join(",") ?? "-"}`;
  }

  return `patch:${operation.timePatch.breakEndMinutes?.join(",") ?? "-"}`;
}

function markFieldOperation(
  fieldStates: Map<RequestFieldKey, string>,
  operation: KotRequestOperation,
  field: RequestFieldKey,
): boolean {
  const nextKey = createCompatibilityKey(operation, field);
  const currentKey = fieldStates.get(field);

  if (currentKey === undefined) {
    fieldStates.set(field, nextKey);

    return true;
  }

  if (currentKey === nextKey) {
    return true;
  }

  if (
    (field === "breakStart" || field === "breakEnd") &&
    currentKey.startsWith("delete:") &&
    nextKey.startsWith("delete:")
  ) {
    return true;
  }

  return false;
}

function removeMinute(list: number[], minutes: number): boolean {
  const index = list.indexOf(minutes);

  if (index < 0) {
    return false;
  }

  list.splice(index, 1);

  return true;
}

function applyDeleteOperation(
  row: SimulatedDayRow,
  operation: Extract<KotRequestOperation, { type: "delete" }>,
): boolean {
  if (operation.label === "clockIn") {
    if (row.clockInMinutes !== operation.minutes) {
      return false;
    }

    row.clockInMinutes = null;

    return true;
  }

  if (operation.label === "clockOut") {
    if (row.clockOutMinutes !== operation.minutes) {
      return false;
    }

    row.clockOutMinutes = null;

    return true;
  }

  if (operation.label === "breakStart") {
    return removeMinute(row.breakStartMinutes, operation.minutes);
  }

  return removeMinute(row.breakEndMinutes, operation.minutes);
}

function applyPatchOperation(
  row: SimulatedDayRow,
  operation: Extract<KotRequestOperation, { type: "patch" }>,
): void {
  if (operation.timePatch.clockInMinutes !== undefined) {
    row.clockInMinutes = operation.timePatch.clockInMinutes;
  }

  if (operation.timePatch.clockOutMinutes !== undefined) {
    row.clockOutMinutes = operation.timePatch.clockOutMinutes;
  }

  if (operation.timePatch.breakStartMinutes !== undefined) {
    row.breakStartMinutes = [...operation.timePatch.breakStartMinutes];
  }

  if (operation.timePatch.breakEndMinutes !== undefined) {
    row.breakEndMinutes = [...operation.timePatch.breakEndMinutes];
  }
}

function applyRequestOperation(
  row: SimulatedDayRow,
  fieldStates: Map<RequestFieldKey, string>,
  operation: KotRequestOperation,
): boolean {
  if (operation.type === "delete") {
    if (!markFieldOperation(fieldStates, operation, operation.label)) {
      return false;
    }

    return applyDeleteOperation(row, operation);
  }

  const affectedFields: RequestFieldKey[] = [];

  if (operation.timePatch.clockInMinutes !== undefined) {
    affectedFields.push("clockIn");
  }

  if (operation.timePatch.clockOutMinutes !== undefined) {
    affectedFields.push("clockOut");
  }

  if (operation.timePatch.breakStartMinutes !== undefined) {
    affectedFields.push("breakStart");
  }

  if (operation.timePatch.breakEndMinutes !== undefined) {
    affectedFields.push("breakEnd");
  }

  if (
    !affectedFields.every((field) =>
      markFieldOperation(fieldStates, operation, field),
    )
  ) {
    return false;
  }

  applyPatchOperation(row, operation);

  return true;
}

function resolveDayEstimate(
  row: KotDayRowSnapshot,
  now: Date,
  requests: readonly KotTimeCorrectionRequest[] | undefined,
): DayEstimateOutcome {
  if (!row.hasError) {
    return {
      effectiveWorkedMinutes: row.workedMinutes,
      resolution: "normal",
      usesEstimate: false,
    };
  }

  if (requests === undefined || requests.length === 0) {
    return {
      effectiveWorkedMinutes: row.workedMinutes,
      resolution: "error",
      usesEstimate: false,
    };
  }

  const simulatedRow = createSimulatedDayRow(row);
  const fieldStates = new Map<RequestFieldKey, string>();

  for (const request of requests) {
    if (!applyRequestOperation(simulatedRow, fieldStates, request.operation)) {
      return {
        effectiveWorkedMinutes: row.workedMinutes,
        resolution: "error",
        usesEstimate: false,
      };
    }
  }

  const derived = deriveWorkedMinutes({
    breakEndMinutes: simulatedRow.breakEndMinutes,
    breakStartMinutes: simulatedRow.breakStartMinutes,
    clockInMinutes: simulatedRow.clockInMinutes,
    clockOutMinutes: simulatedRow.clockOutMinutes,
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
    treatIncompleteAsOngoing: row.isoDate === createIsoDateKey(now),
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
  const todayWorkedMinutes = calculateTodayWorkedMinutes(input.pageSnapshot);
  const todayBreakMinutes = calculateTodayBreakMinutes(input.pageSnapshot);
  const todayDate = createIsoDateKey(input.now);
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
    monthActualProgressPercent: calculateMonthProgressPercent(
      input.pageSnapshot.actualWorkedMinutesSoFar,
      requiredWorkedMinutesInMonth,
    ),
    monthBankMinutes,
    monthEstimatedProgressPercent: calculateMonthProgressPercent(
      displayWorkedMinutesSoFar,
      requiredWorkedMinutesInMonth,
    ),
    progressTone: bankTone,
    requiredWorkedMinutesSoFar,
    todayBreakDiffMinutes: calculateTodayBreakDiffMinutes(
      todayBreakMinutes,
      input.settings,
    ),
    todayBreakMinutes,
    todayErrorCount: input.pageSnapshot.todayRow?.errorCount ?? 0,
    todayStatus: calculateTodayStatus(input.pageSnapshot),
    todayWorkedMinutes,
    todayWorkDiffMinutes: calculateTodayWorkDiffMinutes(
      todayWorkedMinutes,
      input.settings,
    ),
    todayWarningCount: input.pageSnapshot.todayRow?.warningCount ?? 0,
    warningDayCount,
  };
}
