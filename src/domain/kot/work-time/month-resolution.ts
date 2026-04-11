import type { KotMonthlyPageSnapshot } from "@/domain/kot/monthly-page-types";
import type { KotRequestCacheEntry } from "@/domain/kot/request-data";
import {
  applyKotRequestsToDayRow,
  createKotPendingRequestMap,
} from "@/domain/kot/work-time/request-simulation";
import {
  createKotResolveDayContext,
  resolveKotDay,
} from "@/domain/kot/work-time/day-resolution";
import type { KotResolvedDay } from "@/domain/kot/work-time/types";

export type KotResolvedMonthDay = {
  actual: KotResolvedDay;
  effective: KotResolvedDay;
  isoDate: string;
};

export type KotResolvedMonth = {
  actualWorkedMinutesSoFar: number;
  days: readonly KotResolvedMonthDay[];
  displayWorkedMinutesSoFar: number;
  errorDayCount: number;
  isUsingEstimate: boolean;
  todayDay: KotResolvedMonthDay | null;
  warningDayCount: number;
};

export function resolveKotMonth(input: {
  now: Date;
  pageSnapshot: KotMonthlyPageSnapshot;
  requestCacheEntry: KotRequestCacheEntry | null;
}): KotResolvedMonth {
  const dayContext = createKotResolveDayContext(input.now);
  const requestMap = createKotPendingRequestMap(input.requestCacheEntry);

  const days = input.pageSnapshot.rows.map((row) => {
    const actual = resolveKotDay(row, dayContext);
    const requests = row.hasError ? requestMap.get(row.isoDate) : undefined;
    const simulatedRow = applyKotRequestsToDayRow(row, requests);
    const effective =
      simulatedRow === null
        ? requests !== undefined && requests.length > 0
          ? resolveKotDay(row, dayContext, {
              additionalIssueCodes: ["requestConflict"],
            })
          : actual
        : resolveKotDay(simulatedRow, dayContext, {
            additionalIssueCodes: ["requestEstimate"],
          });

    return {
      actual,
      effective,
      isoDate: row.isoDate,
    };
  });

  let actualWorkedMinutesSoFar = 0;
  let displayWorkedMinutesSoFar = 0;
  let errorDayCount = 0;
  let warningDayCount = 0;
  let isUsingEstimate = false;

  days.forEach((day) => {
    if (day.isoDate > dayContext.nowIsoDate) {
      return;
    }

    actualWorkedMinutesSoFar += day.actual.bankMinutes;
    displayWorkedMinutesSoFar += day.effective.bankMinutes;

    if (day.effective.resolution === "error") {
      errorDayCount += 1;
    }

    if (day.effective.resolution === "warning") {
      warningDayCount += 1;
    }

    if (day.effective.usesEstimate) {
      isUsingEstimate = true;
    }
  });

  return {
    actualWorkedMinutesSoFar,
    days,
    displayWorkedMinutesSoFar,
    errorDayCount,
    isUsingEstimate,
    todayDay: days.find((day) => day.isoDate === dayContext.nowIsoDate) ?? null,
    warningDayCount,
  };
}
