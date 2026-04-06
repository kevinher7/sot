export type KotDayKind = "workday" | "offday";
export type KotDayResolution = "normal" | "warning" | "error";

export type KotDayRowSnapshot = {
  breakEndMinutes: readonly number[];
  breakMinutes: number;
  breakStartMinutes: readonly number[];
  clockInMinutes: number | null;
  clockOutMinutes: number | null;
  day: number;
  dayKind: KotDayKind;
  errorCount: number;
  hasError: boolean;
  hasRequestMarker: boolean;
  hasClockIn: boolean;
  hasClockOut: boolean;
  isoDate: string;
  warningCount: number;
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
