import type { KotDayKind, KotDayResolution } from "../monthly-page-types";

export type KotWorkedMinutesSource = "finalized" | "estimated";

export type KotResolvedDayIssueCode =
  | "invalidBreakOrder"
  | "invalidClockOrder"
  | "missingClockIn"
  | "missingClockOut"
  | "ongoingBreak"
  | "ongoingWork"
  | "requestConflict"
  | "requestEstimate"
  | "rowError"
  | "unmatchedBreakEnd"
  | "unmatchedBreakStart";

export type KotResolvedDay = {
  bankMinutes: number;
  breakMinutes: number;
  dayKind: KotDayKind;
  errorCount: number;
  isBankSafe: boolean;
  isoDate: string;
  issueCodes: readonly KotResolvedDayIssueCode[];
  resolution: KotDayResolution;
  usesEstimate: boolean;
  warningCount: number;
  workedMinutesDisplay: number;
  workedMinutesFinalized: number;
  workedMinutesSource: KotWorkedMinutesSource;
};

export type KotResolveDayContext = {
  allowTodayEstimate: boolean;
  nowIsoDate: string;
  nowMinutes: number;
};
