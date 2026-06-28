import {
  detectKotCorrectionNeed,
  type KotCorrectionNeed,
} from "@/domain/kot/calculation/requests/correction-need";
import type { KotResolvedMonth } from "@/domain/kot/calculation/month/month-types";

export type KotCorrectionDetection = {
  needs: readonly KotCorrectionNeed[];
  pendingIsoDates: ReadonlySet<string>;
};

// Map an already-resolved month to, per day, which need a 打刻申請 and which
// already carry a pending request (drives the duplicate-request guard).
export function detectKotCorrectionNeeds(
  resolvedMonth: KotResolvedMonth,
): KotCorrectionDetection {
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
