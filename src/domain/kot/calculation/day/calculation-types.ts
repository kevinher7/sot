import type {
  KotDayKind,
  KotDayResolution,
  KotDayRowSnapshot,
} from "@/domain/kot/monthly-page-types";

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

export type KotResolveDayContext = {
  allowTodayEstimate: boolean;
  nowIsoDate: string;
  nowMinutes: number;
};

export type KotDayScenarioKind = "actual" | "effective";
export type KotDayRequestState = "none" | "applied" | "conflict";

export type KotDayScenarioInput = {
  kind: KotDayScenarioKind;
  interpretedRow: KotDayRowSnapshot;
  requestState: KotDayRequestState;
  sourceRow: KotDayRowSnapshot;
};

export type KotResolvedBreaks = {
  breakMinutesDisplay: number;
  breakMinutesFinalized: number;
  issueCodes: readonly KotResolvedDayIssueCode[];
};

export type KotWorkedTimeInterpretation = {
  breakMinutesDisplay: number;
  breakMinutesFinalized: number;
  usesEstimate: boolean;
  workedMinutesDisplay: number;
  workedMinutesFinalized: number;
  workedMinutesSource: KotWorkedMinutesSource;
};

export type KotDayIssueSummary = {
  errorCount: number;
  issueCodes: readonly KotResolvedDayIssueCode[];
  resolution: KotDayResolution;
  warningCount: number;
};

export type KotCalculatedDay = {
  dayKind: KotDayKind;
  interpretation: KotWorkedTimeInterpretation;
  isoDate: string;
  issues: KotDayIssueSummary;
  requestState: KotDayRequestState;
  scenarioKind: KotDayScenarioKind;
};
