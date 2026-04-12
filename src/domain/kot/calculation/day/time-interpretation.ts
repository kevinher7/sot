import type { KotDayRowSnapshot } from "@/domain/kot/monthly-page-types";
import type {
  KotResolveDayContext,
  KotResolvedBreaks,
  KotResolvedDayIssueCode,
  KotWorkedTimeInterpretation,
} from "@/domain/kot/calculation/day/calculation-types";

export type KotTimeInterpretationResult = {
  interpretation: KotWorkedTimeInterpretation;
  issueCodes: readonly KotResolvedDayIssueCode[];
};

function isClockRangeValid(
  clockInMinutes: number,
  clockOutMinutes: number,
): boolean {
  return clockOutMinutes >= clockInMinutes;
}

export function interpretKotDayTime(input: {
  context: KotResolveDayContext;
  isToday: boolean;
  resolvedBreaks: KotResolvedBreaks;
  row: KotDayRowSnapshot;
}): KotTimeInterpretationResult {
  const { context, isToday, resolvedBreaks, row } = input;
  const issueCodes = new Set<KotResolvedDayIssueCode>();

  if (row.clockInMinutes === null) {
    if (
      row.clockOutMinutes !== null ||
      row.breakStartMinutes.length > 0 ||
      row.breakEndMinutes.length > 0
    ) {
      issueCodes.add("missingClockIn");
    }

    return {
      interpretation: {
        breakMinutesDisplay: resolvedBreaks.breakMinutesDisplay,
        breakMinutesFinalized: resolvedBreaks.breakMinutesFinalized,
        usesEstimate: false,
        workedMinutesDisplay: 0,
        workedMinutesFinalized: 0,
        workedMinutesSource: "finalized",
      },
      issueCodes: [...issueCodes],
    };
  }

  if (row.clockOutMinutes === null) {
    if (
      isToday &&
      context.allowTodayEstimate &&
      context.nowMinutes >= row.clockInMinutes
    ) {
      issueCodes.add("ongoingWork");

      return {
        interpretation: {
          breakMinutesDisplay: resolvedBreaks.breakMinutesDisplay,
          breakMinutesFinalized: resolvedBreaks.breakMinutesFinalized,
          usesEstimate: true,
          workedMinutesDisplay: Math.max(
            context.nowMinutes -
              row.clockInMinutes -
              resolvedBreaks.breakMinutesDisplay,
            0,
          ),
          workedMinutesFinalized: 0,
          workedMinutesSource: "estimated",
        },
        issueCodes: [...issueCodes],
      };
    }

    issueCodes.add("missingClockOut");

    return {
      interpretation: {
        breakMinutesDisplay: resolvedBreaks.breakMinutesFinalized,
        breakMinutesFinalized: resolvedBreaks.breakMinutesFinalized,
        usesEstimate: false,
        workedMinutesDisplay: 0,
        workedMinutesFinalized: 0,
        workedMinutesSource: "finalized",
      },
      issueCodes: [...issueCodes],
    };
  }

  if (!isClockRangeValid(row.clockInMinutes, row.clockOutMinutes)) {
    issueCodes.add("invalidClockOrder");

    return {
      interpretation: {
        breakMinutesDisplay: resolvedBreaks.breakMinutesFinalized,
        breakMinutesFinalized: resolvedBreaks.breakMinutesFinalized,
        usesEstimate: false,
        workedMinutesDisplay: 0,
        workedMinutesFinalized: 0,
        workedMinutesSource: "finalized",
      },
      issueCodes: [...issueCodes],
    };
  }

  const workedSpanMinutes = Math.max(
    row.clockOutMinutes - row.clockInMinutes,
    0,
  );
  const workedMinutesFinalized = Math.max(
    workedSpanMinutes - resolvedBreaks.breakMinutesFinalized,
    0,
  );

  return {
    interpretation: {
      breakMinutesDisplay: resolvedBreaks.breakMinutesFinalized,
      breakMinutesFinalized: resolvedBreaks.breakMinutesFinalized,
      usesEstimate: false,
      workedMinutesDisplay: workedMinutesFinalized,
      workedMinutesFinalized,
      workedMinutesSource: "finalized",
    },
    issueCodes: [...issueCodes],
  };
}
