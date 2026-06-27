import type {
  KotCalculatedDay,
  KotResolvedDayIssueCode,
} from "@/domain/kot/calculation/day/calculation-types";

// Which monthly-page punch cell a marker should attach to.
export type KotPunchField = "clockIn" | "clockOut" | "breakStart" | "breakEnd";

export type KotCorrectionReason = "error" | "conflict";

export type KotCorrectionNeed = {
  isoDate: string;
  reasons: readonly KotCorrectionReason[];
  affectedFields: readonly KotPunchField[];
};

const ISSUE_CODE_FIELDS: Partial<
  Record<KotResolvedDayIssueCode, readonly KotPunchField[]>
> = {
  invalidClockOrder: ["clockIn", "clockOut"],
  missingClockIn: ["clockIn"],
  missingClockOut: ["clockOut"],
  invalidBreakOrder: ["breakStart", "breakEnd"],
  ongoingBreak: ["breakEnd"],
  unmatchedBreakEnd: ["breakEnd"],
  unmatchedBreakStart: ["breakStart"],
};

function collectAffectedFields(
  issueCodes: readonly KotResolvedDayIssueCode[],
): readonly KotPunchField[] {
  const fields = new Set<KotPunchField>();

  for (const code of issueCodes) {
    for (const field of ISSUE_CODE_FIELDS[code] ?? []) {
      fields.add(field);
    }
  }

  return [...fields];
}

// Pure trigger check: a day needs a 打刻申請 when it resolves to an error or
// when its pending request conflicts with the recorded punches.
export function detectKotCorrectionNeed(
  day: KotCalculatedDay,
): KotCorrectionNeed | null {
  const reasons: KotCorrectionReason[] = [];

  if (day.issues.resolution === "error") {
    reasons.push("error");
  }

  if (day.requestState === "conflict") {
    reasons.push("conflict");
  }

  if (reasons.length === 0) {
    return null;
  }

  return {
    affectedFields: collectAffectedFields(day.issues.issueCodes),
    isoDate: day.isoDate,
    reasons,
  };
}
