import type { KotResolvedDay } from "@/domain/kot/calculation/bank/bank-types";
import type { KotDayRowSnapshot } from "@/domain/kot/monthly-page-types";

export type KotResolvedMonthDay = {
  actual: KotResolvedDay;
  // Punches as recorded, and as simulated after pending requests apply. Kept so
  // projections can diff per-field which times a request adds or changes.
  actualRow: KotDayRowSnapshot;
  effective: KotResolvedDay;
  effectiveRow: KotDayRowSnapshot;
  isoDate: string;
};

export type KotMonthSummary = {
  bankMinutesSoFar: number;
  // Night minutes that actually counted toward the bank (bank-safe days only).
  // Subtract this from the bank when the exclusion setting is on.
  bankableLateNightMinutesSoFar: number;
  // Night minutes across all elapsed days, regardless of bank safety. Subtract
  // this from total worked minutes when the exclusion setting is on.
  lateNightMinutesSoFar: number;
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
