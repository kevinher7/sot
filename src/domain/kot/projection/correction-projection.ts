import {
  detectKotCorrectionNeed,
  type KotCorrectionNeed,
} from "@/domain/kot/calculation/requests/correction-need";
import { resolveKotMonth } from "@/domain/kot/calculation/month/month-resolver";
import type { KotMonthlyPageSnapshot } from "@/domain/kot/monthly-page-types";
import type { KotRequestCacheEntry } from "@/domain/kot/request-data";

export type KotCorrectionDetection = {
  needs: readonly KotCorrectionNeed[];
  pendingIsoDates: ReadonlySet<string>;
};

export type KotCorrectionDetectionInput = {
  now: Date;
  pageSnapshot: KotMonthlyPageSnapshot;
  requestCacheEntry: KotRequestCacheEntry | null;
  standardWorkdayHours: number;
};

// Resolve the month and surface, per day, which need a 打刻申請 and which
// already carry a pending request (drives the duplicate-request guard).
export function detectKotCorrectionNeeds(
  input: KotCorrectionDetectionInput,
): KotCorrectionDetection {
  const resolvedMonth = resolveKotMonth({
    now: input.now,
    pageSnapshot: input.pageSnapshot,
    requestCacheEntry: input.requestCacheEntry,
    standardWorkdayHours: input.standardWorkdayHours,
  });

  const needs: KotCorrectionNeed[] = [];
  const pendingIsoDates = new Set<string>();

  for (const day of resolvedMonth.days) {
    const calculatedDay = day.effective.calculatedDay;

    if (calculatedDay.requestState !== "none") {
      pendingIsoDates.add(day.isoDate);
    }

    const need = detectKotCorrectionNeed(calculatedDay);

    if (need !== null) {
      needs.push(need);
    }
  }

  return { needs, pendingIsoDates };
}
