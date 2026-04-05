import type { ExtensionSettings } from "./types";

export type KotDayKind = "workday" | "offday";

export type KotDayRowSnapshot = {
  breakMinutes: number | null;
  clockInMinutes: number | null;
  clockOutMinutes: number | null;
  day: number;
  dayKind: KotDayKind;
  hasClockIn: boolean;
  hasClockOut: boolean;
  isoDate: string;
  workedMinutes: number | null;
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
  settings: OverlayCalculationSettings;
};

export type TodayStatus = "in-progress" | "rest-day" | "not-started";

export type OverlayCalculationResult = {
  actualWorkedMinutesSoFar: number;
  monthBankMinutes: number;
  monthProgressPercent: number;
  requiredWorkedMinutesSoFar: number;
  todayBreakLeftMinutes: number;
  todayBreakMinutes: number;
  todayStatus: TodayStatus;
  todayWorkedMinutes: number;
  todayWorkLeftMinutes: number;
};

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
  actualWorkedMinutesSoFar: number,
  requiredWorkedMinutesSoFar: number,
): number {
  return actualWorkedMinutesSoFar - requiredWorkedMinutesSoFar;
}

export function calculateMonthProgressPercent(
  actualWorkedMinutesSoFar: number,
  requiredWorkedMinutesSoFar: number,
): number {
  if (requiredWorkedMinutesSoFar <= 0) {
    return 0;
  }

  return (actualWorkedMinutesSoFar / requiredWorkedMinutesSoFar) * 100;
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

  return {
    actualWorkedMinutesSoFar: input.pageSnapshot.actualWorkedMinutesSoFar,
    monthBankMinutes: calculateMonthBankMinutes(
      input.pageSnapshot.actualWorkedMinutesSoFar,
      requiredWorkedMinutesSoFar,
    ),
    monthProgressPercent: calculateMonthProgressPercent(
      input.pageSnapshot.actualWorkedMinutesSoFar,
      requiredWorkedMinutesSoFar,
    ),
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
  };
}

function createDateKey(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}
