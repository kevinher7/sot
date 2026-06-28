import type {
  KotBreakRequirement,
  KotResolvedDayIssueCode,
  KotWorkedMinutesSource,
} from "@/domain/kot/calculation/day/calculation-types";

const SIX_HOURS_MINUTES = 6 * 60;
const EIGHT_HOURS_MINUTES = 8 * 60;
const BREAK_FOR_SIX_HOURS = 45;
const BREAK_FOR_EIGHT_HOURS = 60;

const UNRELIABLE_BREAK_ISSUE_CODES: ReadonlySet<KotResolvedDayIssueCode> =
  new Set(["invalidBreakOrder", "unmatchedBreakStart", "unmatchedBreakEnd"]);

function getRequiredBreakMinutes(workedMinutes: number): number {
  if (workedMinutes > EIGHT_HOURS_MINUTES) {
    return BREAK_FOR_EIGHT_HOURS;
  }

  if (workedMinutes > SIX_HOURS_MINUTES) {
    return BREAK_FOR_SIX_HOURS;
  }

  return 0;
}

export function evaluateKotBreakRequirement(input: {
  breakIssueCodes: readonly KotResolvedDayIssueCode[];
  breakMinutesFinalized: number;
  workedMinutesFinalized: number;
  workedMinutesSource: KotWorkedMinutesSource;
}): KotBreakRequirement | null {
  if (input.workedMinutesSource !== "finalized") {
    return null;
  }

  if (
    input.breakIssueCodes.some((code) => UNRELIABLE_BREAK_ISSUE_CODES.has(code))
  ) {
    return null;
  }

  const requiredMinutes = getRequiredBreakMinutes(input.workedMinutesFinalized);

  if (requiredMinutes === 0) {
    return null;
  }

  return {
    breakMinutes: input.breakMinutesFinalized,
    isSufficient: input.breakMinutesFinalized >= requiredMinutes,
    requiredMinutes,
  };
}
