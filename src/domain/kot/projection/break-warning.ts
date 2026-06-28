import type { KotResolvedMonth } from "@/domain/kot/calculation/month/month-types";

export type KotBreakWarningDay = {
  breakMinutes: number;
  isoDate: string;
  requiredMinutes: number;
};

export function buildKotBreakWarnings(
  resolvedMonth: KotResolvedMonth,
): readonly KotBreakWarningDay[] {
  const warnings: KotBreakWarningDay[] = [];

  for (const day of resolvedMonth.days) {
    const requirement = day.effective.calculatedDay.breakRequirement;

    if (requirement === null || requirement.isSufficient) {
      continue;
    }

    warnings.push({
      breakMinutes: requirement.breakMinutes,
      isoDate: day.isoDate,
      requiredMinutes: requirement.requiredMinutes,
    });
  }

  return warnings;
}
