import type {
  OverlayDurationMetricProjection,
  OverlayModeProjectionInput,
  OverlayModeProjectionResult,
} from "@/domain/kot/projection/overlay-mode/types";
import { createTodayMetricVisualState } from "@/domain/kot/projection/overlay-mode/today-metric-visual-state";

function createRestDayMetric(label: string): OverlayDurationMetricProjection {
  return {
    appearance: "rest-day",
    cardTone: "neutral",
    format: "unsigned-duration",
    label,
    minutes: 0,
    tone: "neutral",
    unit: "",
    viewBinding: undefined,
  };
}

function createBreakTone(
  minutes: number,
): OverlayDurationMetricProjection["tone"] {
  if (minutes < 0) {
    return "negative";
  }

  if (minutes > 0) {
    return "positive";
  }

  return "neutral";
}

function createMonthPrimaryMetric(
  input: OverlayModeProjectionInput,
): OverlayDurationMetricProjection {
  return {
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
    viewBinding: undefined,
  };
}

export function projectInternOverlayMode(
  input: OverlayModeProjectionInput,
): OverlayModeProjectionResult {
  if (input.todayStatus === "rest-day") {
    return {
      monthPrimaryMetric: createMonthPrimaryMetric(input),
      todayPrimaryMetric: createRestDayMetric("Work time"),
      todaySecondaryMetric: createRestDayMetric("Break left"),
      workMode: "intern",
    };
  }

  const isNotStarted = input.todayStatus === "not-started";
  const hasTodayError = input.todayErrorCount > 0;
  const breakRemainingMinutes = isNotStarted
    ? -input.todayBreakAllowanceMinutes
    : input.todayBreakDiffMinutes;
  const breakRemainingTone = createBreakTone(breakRemainingMinutes);
  const todayMetricVisualState = createTodayMetricVisualState({
    activePrimaryCardTone: "positive",
    activeSecondaryCardTone: hasTodayError
      ? input.todayBreakMetricCardTone
      : breakRemainingTone,
    hasTodayError,
    isNotStarted,
  });

  return {
    monthPrimaryMetric: createMonthPrimaryMetric(input),
    todayPrimaryMetric: {
      appearance: todayMetricVisualState.appearance,
      cardTone: todayMetricVisualState.primaryCardTone,
      format: "unsigned-duration",
      label: "Work time",
      minutes: input.todayWorkedMinutes,
      tone: isNotStarted ? "neutral" : "positive",
      unit: "h",
      viewBinding: undefined,
    },
    todaySecondaryMetric: {
      appearance: todayMetricVisualState.appearance,
      cardTone: todayMetricVisualState.secondaryCardTone,
      format: "signed-duration",
      label: "Break left",
      minutes: breakRemainingMinutes,
      tone: breakRemainingTone,
      unit: "h",
      viewBinding: undefined,
    },
    workMode: "intern",
  };
}
