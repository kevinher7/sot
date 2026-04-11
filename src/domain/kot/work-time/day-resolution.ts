import type { KotDayRowSnapshot } from "../monthly-page-types";
import { createIsoDateKey } from "../date";
import { resolveKotBreaks } from "./break-resolution";
import type {
  KotResolveDayContext,
  KotResolvedDay,
  KotResolvedDayIssueCode,
} from "./types";

function createResolvedDay(params: {
  row: KotDayRowSnapshot;
  issueCodes: readonly KotResolvedDayIssueCode[];
  breakMinutes: number;
  workedMinutesDisplay: number;
  workedMinutesFinalized: number;
  usesEstimate: boolean;
}): KotResolvedDay {
  const issueCodeSet = new Set(params.issueCodes);
  const warningIssueCodes = new Set<KotResolvedDayIssueCode>();
  const errorIssueCodes = new Set<KotResolvedDayIssueCode>();

  issueCodeSet.forEach((issueCode) => {
    if (
      issueCode === "ongoingBreak" ||
      issueCode === "ongoingWork" ||
      issueCode === "requestEstimate"
    ) {
      warningIssueCodes.add(issueCode);

      return;
    }

    errorIssueCodes.add(issueCode);
  });

  const isBankSafe = errorIssueCodes.size === 0;

  return {
    bankMinutes: isBankSafe ? params.workedMinutesDisplay : 0,
    breakMinutes: params.breakMinutes,
    dayKind: params.row.dayKind,
    errorCount: errorIssueCodes.size,
    isBankSafe,
    isoDate: params.row.isoDate,
    issueCodes: [...issueCodeSet],
    resolution:
      errorIssueCodes.size > 0
        ? "error"
        : warningIssueCodes.size > 0
          ? "warning"
          : "normal",
    usesEstimate: params.usesEstimate,
    warningCount: warningIssueCodes.size,
    workedMinutesDisplay: params.workedMinutesDisplay,
    workedMinutesFinalized: params.workedMinutesFinalized,
    workedMinutesSource: params.usesEstimate ? "estimated" : "finalized",
  };
}

function isClockRangeValid(
  clockInMinutes: number,
  clockOutMinutes: number,
): boolean {
  return clockOutMinutes >= clockInMinutes;
}

export function resolveKotDay(
  row: KotDayRowSnapshot,
  context: KotResolveDayContext,
  options?: {
    additionalIssueCodes?: readonly KotResolvedDayIssueCode[];
  },
): KotResolvedDay {
  const isToday = row.isoDate === context.nowIsoDate;
  const issueCodes = new Set<KotResolvedDayIssueCode>(
    options?.additionalIssueCodes ?? [],
  );

  if (row.hasError) {
    issueCodes.add("rowError");
  }

  const resolvedBreaks = resolveKotBreaks({
    allowTodayEstimate: context.allowTodayEstimate,
    breakEndMinutes: row.breakEndMinutes,
    breakStartMinutes: row.breakStartMinutes,
    isToday,
    nowMinutes: context.nowMinutes,
  });

  resolvedBreaks.issueCodes.forEach((issueCode) => {
    issueCodes.add(issueCode);
  });

  if (row.clockInMinutes === null) {
    if (
      row.clockOutMinutes !== null ||
      row.breakStartMinutes.length > 0 ||
      row.breakEndMinutes.length > 0
    ) {
      issueCodes.add("missingClockIn");
    }

    return createResolvedDay({
      breakMinutes: resolvedBreaks.breakMinutesDisplay,
      issueCodes: [...issueCodes],
      row,
      usesEstimate: false,
      workedMinutesDisplay: 0,
      workedMinutesFinalized: 0,
    });
  }

  if (row.clockOutMinutes === null) {
    if (
      isToday &&
      context.allowTodayEstimate &&
      context.nowMinutes >= row.clockInMinutes
    ) {
      issueCodes.add("ongoingWork");

      const workedMinutesDisplay = Math.max(
        context.nowMinutes -
          row.clockInMinutes -
          resolvedBreaks.breakMinutesDisplay,
        0,
      );

      return createResolvedDay({
        breakMinutes: resolvedBreaks.breakMinutesDisplay,
        issueCodes: [...issueCodes],
        row,
        usesEstimate: true,
        workedMinutesDisplay,
        workedMinutesFinalized: 0,
      });
    }

    issueCodes.add("missingClockOut");

    return createResolvedDay({
      breakMinutes: resolvedBreaks.breakMinutesFinalized,
      issueCodes: [...issueCodes],
      row,
      usesEstimate: false,
      workedMinutesDisplay: 0,
      workedMinutesFinalized: 0,
    });
  }

  if (!isClockRangeValid(row.clockInMinutes, row.clockOutMinutes)) {
    issueCodes.add("invalidClockOrder");

    return createResolvedDay({
      breakMinutes: resolvedBreaks.breakMinutesFinalized,
      issueCodes: [...issueCodes],
      row,
      usesEstimate: false,
      workedMinutesDisplay: 0,
      workedMinutesFinalized: 0,
    });
  }

  const workedSpanMinutes = Math.max(
    row.clockOutMinutes - row.clockInMinutes,
    0,
  );
  const workedMinutesFinalized = Math.max(
    workedSpanMinutes - resolvedBreaks.breakMinutesFinalized,
    0,
  );

  return createResolvedDay({
    breakMinutes: resolvedBreaks.breakMinutesFinalized,
    issueCodes: [...issueCodes],
    row,
    usesEstimate: false,
    workedMinutesDisplay: workedMinutesFinalized,
    workedMinutesFinalized,
  });
}

export function createKotResolveDayContext(now: Date): KotResolveDayContext {
  return {
    allowTodayEstimate: true,
    nowIsoDate: createIsoDateKey(now),
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
  };
}
