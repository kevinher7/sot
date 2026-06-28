import type { KotResolvedMonth } from "@/domain/kot/calculation/month/month-types";

// Per-day amber values to inject into the host monthly table. Time fields hold
// only the entries a pending request adds or changes (effective minus actual);
// the two totals are the request-corrected break / work estimates.
export type KotRequestInjectionDay = {
  breakEndMinutes: readonly number[];
  breakStartMinutes: readonly number[];
  breakTotalMinutes: number;
  clockInMinutes: number | undefined;
  clockOutMinutes: number | undefined;
  isoDate: string;
  workTotalMinutes: number;
};

function diffAddedMinutes(
  actual: readonly number[],
  effective: readonly number[],
): number[] {
  const remaining = [...actual];
  const added: number[] = [];

  for (const minutes of effective) {
    const index = remaining.indexOf(minutes);

    if (index >= 0) {
      remaining.splice(index, 1);
      continue;
    }

    added.push(minutes);
  }

  return added;
}

function diffScalarMinutes(
  actual: number | null,
  effective: number | null,
): number | undefined {
  if (effective === null || effective === actual) {
    return undefined;
  }

  return effective;
}

export function buildKotRequestInjections(
  resolvedMonth: KotResolvedMonth,
): readonly KotRequestInjectionDay[] {
  const injections: KotRequestInjectionDay[] = [];

  for (const day of resolvedMonth.days) {
    const effectiveDay = day.effective.calculatedDay;

    // Only days whose pending requests applied cleanly. On conflict the
    // effective row falls back to actual, so there is nothing to show.
    if (effectiveDay.requestState !== "applied") {
      continue;
    }

    injections.push({
      breakEndMinutes: diffAddedMinutes(
        day.actualRow.breakEndMinutes,
        day.effectiveRow.breakEndMinutes,
      ),
      breakStartMinutes: diffAddedMinutes(
        day.actualRow.breakStartMinutes,
        day.effectiveRow.breakStartMinutes,
      ),
      breakTotalMinutes: effectiveDay.interpretation.breakMinutesDisplay,
      clockInMinutes: diffScalarMinutes(
        day.actualRow.clockInMinutes,
        day.effectiveRow.clockInMinutes,
      ),
      clockOutMinutes: diffScalarMinutes(
        day.actualRow.clockOutMinutes,
        day.effectiveRow.clockOutMinutes,
      ),
      isoDate: day.isoDate,
      workTotalMinutes: effectiveDay.interpretation.workedMinutesDisplay,
    });
  }

  return injections;
}
