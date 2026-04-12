import type { KotCalculatedDay, KotResolvedDayIssueCode } from "@/domain/kot/calculation/day/calculation-types";

export type KotBankEvaluation = {
  bankMinutes: number;
  blockedByIssueCodes: readonly KotResolvedDayIssueCode[];
  isBankSafe: boolean;
};

export type KotResolvedDay = {
  bank: KotBankEvaluation;
  calculatedDay: KotCalculatedDay;
};
