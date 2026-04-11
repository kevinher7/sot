import type { KotResolvedDayIssueCode } from "@/domain/kot/work-time/types";

export type KotResolvedBreaks = {
  breakMinutesDisplay: number;
  breakMinutesFinalized: number;
  issueCodes: readonly KotResolvedDayIssueCode[];
};

function isExplicitNextDayMinutes(minutes: number): boolean {
  return minutes > 24 * 60;
}

function isEndMinutesValid(startMinutes: number, endMinutes: number): boolean {
  if (endMinutes >= startMinutes) {
    return true;
  }

  return isExplicitNextDayMinutes(endMinutes);
}

export function resolveKotBreaks(input: {
  allowTodayEstimate: boolean;
  breakEndMinutes: readonly number[];
  breakStartMinutes: readonly number[];
  isToday: boolean;
  nowMinutes: number;
}): KotResolvedBreaks {
  const issueCodes = new Set<KotResolvedDayIssueCode>();
  const pairCount = Math.min(
    input.breakStartMinutes.length,
    input.breakEndMinutes.length,
  );
  let breakMinutesFinalized = 0;

  for (let index = 0; index < pairCount; index += 1) {
    const breakStartMinutes = input.breakStartMinutes[index];
    const breakEndMinutes = input.breakEndMinutes[index];

    if (breakStartMinutes === undefined || breakEndMinutes === undefined) {
      continue;
    }

    if (!isEndMinutesValid(breakStartMinutes, breakEndMinutes)) {
      issueCodes.add("invalidBreakOrder");
      continue;
    }

    breakMinutesFinalized += Math.max(breakEndMinutes - breakStartMinutes, 0);
  }

  if (input.breakEndMinutes.length > input.breakStartMinutes.length) {
    issueCodes.add("unmatchedBreakEnd");
  }

  const unmatchedBreakStarts = input.breakStartMinutes.length - pairCount;
  let breakMinutesDisplay = breakMinutesFinalized;

  if (unmatchedBreakStarts > 0) {
    const activeBreakStartMinutes =
      input.breakStartMinutes[input.breakStartMinutes.length - 1];

    if (
      unmatchedBreakStarts === 1 &&
      input.isToday &&
      input.allowTodayEstimate &&
      activeBreakStartMinutes !== undefined &&
      input.nowMinutes >= activeBreakStartMinutes
    ) {
      issueCodes.add("ongoingBreak");
      breakMinutesDisplay += input.nowMinutes - activeBreakStartMinutes;
    } else {
      issueCodes.add("unmatchedBreakStart");
    }
  }

  return {
    breakMinutesDisplay,
    breakMinutesFinalized,
    issueCodes: [...issueCodes],
  };
}
