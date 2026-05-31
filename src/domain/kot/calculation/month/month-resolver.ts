import { attachKotBankEvaluation } from "@/domain/kot/calculation/bank/bank-policy";
import {
  calculateKotDay,
  createKotResolveDayContext,
} from "@/domain/kot/calculation/day/day-calculator";
import { buildDayScenarios } from "@/domain/kot/calculation/day/scenario-builders";
import {
  createKotApprovedLeaveMap,
  resolveKotDayKindWithLeave,
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
  KotLeaveKind,
  KotRequestCacheEntry,
  KotTimeCorrectionRequest,
} from "@/domain/kot/request-data";

function applyLeaveKindToRow(
  row: KotDayRowSnapshot,
  leaveMap: ReadonlyMap<string, KotLeaveKind>,
): KotDayRowSnapshot {
  const leaveKind = leaveMap.get(row.isoDate);
  const effectiveDayKind = resolveKotDayKindWithLeave(row.dayKind, leaveKind);

  if (effectiveDayKind === row.dayKind) {
    return row;
  }

  return { ...row, dayKind: effectiveDayKind };
}

function resolveKotMonthDay(input: {
  dayContext: ReturnType<typeof createKotResolveDayContext>;
  leaveMap: ReadonlyMap<string, KotLeaveKind>;
  requestMap: ReadonlyMap<string, readonly KotTimeCorrectionRequest[]>;
  row: KotDayRowSnapshot;
}): KotResolvedMonthDay {
  const row = applyLeaveKindToRow(input.row, input.leaveMap);
  const pendingRequests = getKotPendingRequestsForDate(
    input.requestMap,
    row.isoDate,
  );
  const scenarios = buildDayScenarios(row, pendingRequests);

  return {
    actual: attachKotBankEvaluation(
      calculateKotDay(scenarios.actual, input.dayContext),
    ),
    effective: attachKotBankEvaluation(
      calculateKotDay(scenarios.effective, input.dayContext),
    ),
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
  const leaveMap = createKotApprovedLeaveMap(input.requestCacheEntry);
  const days = input.pageSnapshot.rows.map((row) =>
    resolveKotMonthDay({
      dayContext,
      leaveMap,
      requestMap,
      row,
    }),
  );

  return aggregateKotMonth({
    days,
    nowIsoDate: dayContext.nowIsoDate,
  });
}
