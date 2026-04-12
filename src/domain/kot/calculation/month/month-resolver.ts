import { attachKotBankEvaluation } from "@/domain/kot/calculation/bank/bank-policy";
import { calculateKotDay, createKotResolveDayContext } from "@/domain/kot/calculation/day/day-calculator";
import { buildDayScenarios } from "@/domain/kot/calculation/day/scenario-builders";
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
  KotTimeCorrectionRequest,
} from "@/domain/kot/request-data";

function resolveKotMonthDay(input: {
  dayContext: ReturnType<typeof createKotResolveDayContext>;
  requestMap: ReadonlyMap<string, readonly KotTimeCorrectionRequest[]>;
  row: KotDayRowSnapshot;
}): KotResolvedMonthDay {
  const pendingRequests = getKotPendingRequestsForDate(
    input.requestMap,
    input.row.isoDate,
  );
  const scenarios = buildDayScenarios(input.row, pendingRequests);

  return {
    actual: attachKotBankEvaluation(
      calculateKotDay(scenarios.actual, input.dayContext),
    ),
    effective: attachKotBankEvaluation(
      calculateKotDay(scenarios.effective, input.dayContext),
    ),
    isoDate: input.row.isoDate,
  };
}

export function resolveKotMonth(input: {
  now: Date;
  pageSnapshot: KotMonthlyPageSnapshot;
  requestCacheEntry: KotRequestCacheEntry | null;
}): KotResolvedMonth {
  const dayContext = createKotResolveDayContext(input.now);
  const requestMap = createKotPendingRequestMap(input.requestCacheEntry);
  const days = input.pageSnapshot.rows.map((row) =>
    resolveKotMonthDay({
      dayContext,
      requestMap,
      row,
    }),
  );

  return aggregateKotMonth({
    days,
    nowIsoDate: dayContext.nowIsoDate,
  });
}
