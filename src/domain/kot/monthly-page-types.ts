export type KotDayKind = "workday" | "offday";
export type KotDayResolution = "normal" | "warning" | "error";

export type KotDayRowSnapshot = {
  breakEndMinutes: readonly number[];
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
};

export type KotMonthlyPageSnapshot = {
  month: number;
  rows: readonly KotDayRowSnapshot[];
  signature: string;
  todayRow: KotDayRowSnapshot | null;
  year: number;
};
