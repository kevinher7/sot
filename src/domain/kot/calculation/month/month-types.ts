import type { KotResolvedDay } from "@/domain/kot/calculation/bank/bank-types";

export type KotResolvedMonthDay = {
  actual: KotResolvedDay;
  effective: KotResolvedDay;
  isoDate: string;
};

export type KotMonthSummary = {
  bankMinutesSoFar: number;
  workedMinutesSoFar: number;
};

export type KotMonthAggregateFlags = {
  errorDayCount: number;
  isUsingEstimate: boolean;
  warningDayCount: number;
};

export type KotResolvedMonth = {
  actualSummary: KotMonthSummary;
  aggregateFlags: KotMonthAggregateFlags;
  days: readonly KotResolvedMonthDay[];
  effectiveSummary: KotMonthSummary;
  todayDay: KotResolvedMonthDay | null;
};
