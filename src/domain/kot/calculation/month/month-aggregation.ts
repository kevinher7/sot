import type {
  KotResolvedMonth,
  KotResolvedMonthDay,
} from "@/domain/kot/calculation/month/month-types";

export function aggregateKotMonth(input: {
  days: readonly KotResolvedMonthDay[];
  nowIsoDate: string;
}): KotResolvedMonth {
  let actualWorkedMinutesSoFar = 0;
  let actualBankMinutesSoFar = 0;
  let effectiveWorkedMinutesSoFar = 0;
  let effectiveBankMinutesSoFar = 0;
  let errorDayCount = 0;
  let warningDayCount = 0;
  let isUsingEstimate = false;

  input.days.forEach((day) => {
    if (day.isoDate > input.nowIsoDate) {
      return;
    }

    actualWorkedMinutesSoFar +=
      day.actual.calculatedDay.interpretation.workedMinutesDisplay;
    actualBankMinutesSoFar += day.actual.bank.bankMinutes;
    effectiveWorkedMinutesSoFar +=
      day.effective.calculatedDay.interpretation.workedMinutesDisplay;
    effectiveBankMinutesSoFar += day.effective.bank.bankMinutes;

    if (day.effective.calculatedDay.issues.resolution === "error") {
      errorDayCount += 1;
    }

    if (day.effective.calculatedDay.issues.resolution === "warning") {
      warningDayCount += 1;
    }

    if (day.effective.calculatedDay.interpretation.usesEstimate) {
      isUsingEstimate = true;
    }
  });

  return {
    actualSummary: {
      bankMinutesSoFar: actualBankMinutesSoFar,
      workedMinutesSoFar: actualWorkedMinutesSoFar,
    },
    aggregateFlags: {
      errorDayCount,
      isUsingEstimate,
      warningDayCount,
    },
    days: input.days,
    effectiveSummary: {
      bankMinutesSoFar: effectiveBankMinutesSoFar,
      workedMinutesSoFar: effectiveWorkedMinutesSoFar,
    },
    todayDay: input.days.find((day) => day.isoDate === input.nowIsoDate) ?? null,
  };
}
