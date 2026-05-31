import { createIsoDateKey } from "@/domain/kot/date";
import { calculateKotBreaks } from "@/domain/kot/calculation/day/break-calculation";
import { assessKotDayIssues } from "@/domain/kot/calculation/day/issue-assessment";
import { interpretKotDayTime } from "@/domain/kot/calculation/day/time-interpretation";
import type {
  KotCalculatedDay,
  KotDayScenarioInput,
  KotResolveDayContext,
} from "@/domain/kot/calculation/day/calculation-types";
import { getKotLeaveCreditMinutes } from "@/domain/kot/calculation/leave/leave-credit";

export function calculateKotDay(
  scenario: KotDayScenarioInput,
  context: KotResolveDayContext,
): KotCalculatedDay {
  const row = scenario.interpretedRow;
  const isToday = row.isoDate === context.nowIsoDate;
  const resolvedBreaks = calculateKotBreaks({
    allowTodayEstimate: context.allowTodayEstimate,
    breakEndMinutes: row.breakEndMinutes,
    breakStartMinutes: row.breakStartMinutes,
    isToday,
    nowMinutes: context.nowMinutes,
  });
  const timeResult = interpretKotDayTime({
    context,
    isToday,
    resolvedBreaks,
    row,
  });
  const issues = assessKotDayIssues({
    breakIssueCodes: resolvedBreaks.issueCodes,
    requestState: scenario.requestState,
    rowHasError: row.hasError,
    timeIssueCodes: timeResult.issueCodes,
  });

  const leaveCredit = getKotLeaveCreditMinutes(
    row.dayKind,
    context.standardWorkdayHours,
  );
  const interpretation =
    leaveCredit > 0
      ? {
          ...timeResult.interpretation,
          workedMinutesDisplay:
            timeResult.interpretation.workedMinutesDisplay + leaveCredit,
          workedMinutesFinalized:
            timeResult.interpretation.workedMinutesFinalized + leaveCredit,
        }
      : timeResult.interpretation;

  return {
    dayKind: row.dayKind,
    interpretation,
    isoDate: row.isoDate,
    issues,
    requestState: scenario.requestState,
    scenarioKind: scenario.kind,
  };
}

export function createKotResolveDayContext(
  now: Date,
  standardWorkdayHours: number,
): KotResolveDayContext {
  return {
    allowTodayEstimate: true,
    nowIsoDate: createIsoDateKey(now),
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
    standardWorkdayHours,
  };
}
