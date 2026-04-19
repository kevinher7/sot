import type {
  OverlayDurationMetricProjection,
  OverlayModeProjectionInput,
  OverlayModeProjectionResult,
} from "@/domain/kot/projection/overlay-mode/types";

function createRestDayMetric(
  label: string,
): OverlayDurationMetricProjection {
  return {
    appearance: "rest-day",
    cardTone: "neutral",
    format: "unsigned-duration",
    label,
    minutes: 0,
    tone: "neutral",
    unit: "",
  };
}

function createSignedTone(minutes: number): OverlayDurationMetricProjection["tone"] {
  if (minutes < 0) {
    return "negative";
  }

  if (minutes > 0) {
    return "positive";
  }

  return "neutral";
}

export function projectFullOverlayMode(
  input: OverlayModeProjectionInput,
): OverlayModeProjectionResult {
  const todayPrimaryMinutes =
    input.todayStatus === "not-started"
      ? -input.requiredWorkdayMinutes
      : input.todayWorkDiffMinutes;
  const todaySecondaryMinutes =
    input.todayStatus === "not-started"
      ? -input.todayBreakAllowanceMinutes
      : input.todayBreakDiffMinutes;

  if (input.todayStatus === "rest-day") {
    return {
      monthPrimaryMetric: {
        appearance: "default",
        cardTone: input.monthBankTone,
        format: "signed-duration",
        label: "Bank",
        minutes: input.monthBankMinutes,
        tone:
          input.monthBankMinutes > 0
            ? "positive"
            : input.monthBankMinutes < 0
              ? "negative"
              : "neutral",
        unit: "h",
      },
      monthProgressMetric: {
        actualPercent: input.monthProgressActualPercent,
        estimatedPercent: input.monthProgressEstimatedPercent,
        label: "TOTAL",
        tone: input.monthBankTone,
      },
      todayPrimaryMetric: createRestDayMetric("Work left"),
      todaySecondaryMetric: createRestDayMetric("Break left"),
      workMode: "full",
    };
  }

  return {
    monthPrimaryMetric: {
      appearance: "default",
      cardTone: input.monthBankTone,
      format: "signed-duration",
      label: "Bank",
      minutes: input.monthBankMinutes,
      tone:
        input.monthBankMinutes > 0
          ? "positive"
          : input.monthBankMinutes < 0
            ? "negative"
            : "neutral",
      unit: "h",
    },
    monthProgressMetric: {
      actualPercent: input.monthProgressActualPercent,
      estimatedPercent: input.monthProgressEstimatedPercent,
      label: "TOTAL",
      tone: input.monthBankTone,
    },
    todayPrimaryMetric: {
      appearance: "default",
      cardTone: createSignedTone(todayPrimaryMinutes),
      format: "signed-duration",
      label: "Work left",
      minutes: todayPrimaryMinutes,
      tone: createSignedTone(todayPrimaryMinutes),
      unit: "h",
    },
    todaySecondaryMetric: {
      appearance: "default",
      cardTone:
        input.todayErrorCount > 0
          ? input.todayBreakMetricCardTone
          : createSignedTone(todaySecondaryMinutes),
      format: "signed-duration",
      label: "Break left",
      minutes: todaySecondaryMinutes,
      tone: createSignedTone(todaySecondaryMinutes),
      unit: "h",
    },
    workMode: "full",
  };
}
