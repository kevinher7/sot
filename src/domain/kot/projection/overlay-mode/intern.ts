import type {
  OverlayDurationMetricProjection,
  OverlayModeProjectionInput,
  OverlayModeProjectionResult,
} from "@/domain/kot/projection/overlay-mode/types";

function createRestDayMetric(label: string): OverlayDurationMetricProjection {
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

export function projectInternOverlayMode(
  input: OverlayModeProjectionInput,
): OverlayModeProjectionResult {
  if (input.todayStatus === "rest-day") {
    return {
      monthPrimaryMetric: {
        appearance: "default",
        cardTone: input.monthWorkedCardTone,
        format: "unsigned-duration",
        label: "Total",
        minutes: input.resolvedMonth.effectiveSummary.workedMinutesSoFar,
        tone:
          input.resolvedMonth.effectiveSummary.workedMinutesSoFar > 0
            ? "positive"
            : "neutral",
        unit: "h",
      },
      monthProgressMetric: null,
      todayPrimaryMetric: createRestDayMetric("Work time"),
      todaySecondaryMetric: createRestDayMetric("Break left"),
      workMode: "intern",
    };
  }

  const isNotStarted = input.todayStatus === "not-started";
  const breakRemainingMinutes =
    input.todayStatus === "not-started"
      ? -input.todayBreakAllowanceMinutes
      : input.todayBreakDiffMinutes;

  return {
    monthPrimaryMetric: {
      appearance: "default",
      cardTone: input.monthWorkedCardTone,
      format: "unsigned-duration",
      label: "Total",
      minutes: input.resolvedMonth.effectiveSummary.workedMinutesSoFar,
      tone:
        input.resolvedMonth.effectiveSummary.workedMinutesSoFar > 0
          ? "positive"
          : "neutral",
      unit: "h",
    },
    monthProgressMetric: null,
    todayPrimaryMetric: {
      appearance: isNotStarted ? "subtle" : "default",
      cardTone: isNotStarted ? "neutral" : "positive",
      format: "unsigned-duration",
      label: "Work time",
      minutes: input.todayWorkedMinutes,
      tone: isNotStarted ? "neutral" : "positive",
      unit: "h",
    },
    todaySecondaryMetric: {
      appearance: "default",
      cardTone:
        input.todayErrorCount > 0
          ? input.todayBreakMetricCardTone
          : breakRemainingMinutes < 0
            ? "negative"
            : breakRemainingMinutes > 0
              ? "positive"
              : "neutral",
      format: "signed-duration",
      label: "Break left",
      minutes: breakRemainingMinutes,
      tone:
        breakRemainingMinutes < 0
          ? "negative"
          : breakRemainingMinutes > 0
            ? "positive"
            : "neutral",
      unit: "h",
    },
    workMode: "intern",
  };
}
