import { attachKotBankEvaluation } from "@/domain/kot/calculation/bank/bank-policy";
import {
  calculateKotDay,
  createKotResolveDayContext,
} from "@/domain/kot/calculation/day/day-calculator";
import { buildDayScenarios } from "@/domain/kot/calculation/day/scenario-builders";
import {
  createKotScheduleRequestMap,
  resolveKotDayKindWithSchedule,
  type KotDayScheduleRequests,
} from "@/domain/kot/calculation/leave/leave-resolution";
import { aggregateKotMonth } from "@/domain/kot/calculation/month/month-aggregation";
import type {
  KotResolvedMonth,
  KotResolvedMonthDay,
} from "@/domain/kot/calculation/month/month-types";
import { getKotPendingRequestsForDate } from "@/domain/kot/calculation/requests/request-scenario";
import { createKotPendingRequestMap } from "@/domain/kot/calculation/requests/request-simulation";
import type {
  KotDayRowSnapshot,
  KotMonthlyPageSnapshot,
} from "@/domain/kot/monthly-page-types";
import type {
  KotRequestCacheEntry,
  KotScheduleKind,
  KotTimeCorrectionRequest,
} from "@/domain/kot/request-data";

function applyScheduleKindToRow(
  row: KotDayRowSnapshot,
  scheduleKind: KotScheduleKind | undefined,
): KotDayRowSnapshot {
  const effectiveDayKind = resolveKotDayKindWithSchedule(
    row.dayKind,
    scheduleKind,
  );

  if (effectiveDayKind === row.dayKind) {
    return row;
  }

  return { ...row, dayKind: effectiveDayKind };
}

function resolveKotMonthDay(input: {
  dayContext: ReturnType<typeof createKotResolveDayContext>;
  requestMap: ReadonlyMap<string, readonly KotTimeCorrectionRequest[]>;
  row: KotDayRowSnapshot;
  scheduleRequests: KotDayScheduleRequests | undefined;
}): KotResolvedMonthDay {
  const row = applyScheduleKindToRow(
    input.row,
    input.scheduleRequests?.approved?.scheduleKind,
  );
  const pendingRequests = getKotPendingRequestsForDate(
    input.requestMap,
    row.isoDate,
  );
  const scenarios = buildDayScenarios(row, pendingRequests);
  const latestScheduleRequest = input.scheduleRequests?.latest;
  const effectiveRow = applyScheduleKindToRow(
    scenarios.effective.interpretedRow,
    latestScheduleRequest?.scheduleKind,
  );
  const effectiveScenario = {
    ...scenarios.effective,
    hasPendingScheduleRequest: latestScheduleRequest?.status === "pending",
    interpretedRow: effectiveRow,
  };

  return {
    actual: attachKotBankEvaluation(
      calculateKotDay(scenarios.actual, input.dayContext),
    ),
    actualRow: row,
    effective: attachKotBankEvaluation(
      calculateKotDay(effectiveScenario, input.dayContext),
    ),
    effectiveRow,
    isoDate: row.isoDate,
  };
}

export function resolveKotMonth(input: {
  now: Date;
  pageSnapshot: KotMonthlyPageSnapshot;
  requestCacheEntry: KotRequestCacheEntry | null;
  standardWorkdayHours: number;
}): KotResolvedMonth {
  const dayContext = createKotResolveDayContext(
    input.now,
    input.standardWorkdayHours,
  );
  const requestMap = createKotPendingRequestMap(input.requestCacheEntry);
  const scheduleMap = createKotScheduleRequestMap(input.requestCacheEntry);
  const days = input.pageSnapshot.rows.map((row) =>
    resolveKotMonthDay({
      dayContext,
      requestMap,
      row,
      scheduleRequests: scheduleMap.get(row.isoDate),
    }),
  );

  return aggregateKotMonth({
    days,
    nowIsoDate: dayContext.nowIsoDate,
  });
}
