import type { KotCalculatedDay } from "@/domain/kot/calculation/day/calculation-types";
import type { KotBankEvaluation, KotResolvedDay } from "@/domain/kot/calculation/bank/bank-types";

export function evaluateKotDayBank(
  calculatedDay: KotCalculatedDay,
): KotBankEvaluation {
  if (calculatedDay.issues.errorCount > 0) {
    return {
      bankMinutes: 0,
      blockedByIssueCodes: calculatedDay.issues.issueCodes,
      isBankSafe: false,
    };
  }

  return {
    bankMinutes: calculatedDay.interpretation.workedMinutesDisplay,
    blockedByIssueCodes: [],
    isBankSafe: true,
  };
}

export function attachKotBankEvaluation(
  calculatedDay: KotCalculatedDay,
): KotResolvedDay {
  return {
    bank: evaluateKotDayBank(calculatedDay),
    calculatedDay,
  };
}
