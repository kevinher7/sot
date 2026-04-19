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
  };
}

function createSignedTone(
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
  };
}

export function projectFullOverlayMode(
  input: OverlayModeProjectionInput,
): OverlayModeProjectionResult {
  const isNotStarted = input.todayStatus === "not-started";
  const hasTodayError = input.todayErrorCount > 0;
  const todayPrimaryMinutes = isNotStarted
    ? -input.requiredWorkdayMinutes
    : input.todayWorkDiffMinutes;
  const todaySecondaryMinutes = isNotStarted
    ? -input.todayBreakAllowanceMinutes
    : input.todayBreakDiffMinutes;
  const todayPrimaryTone = createSignedTone(todayPrimaryMinutes);
  const todaySecondaryTone = createSignedTone(todaySecondaryMinutes);
  const todayMetricVisualState = createTodayMetricVisualState({
    activePrimaryCardTone: todayPrimaryTone,
    activeSecondaryCardTone: hasTodayError
      ? input.todayBreakMetricCardTone
      : todaySecondaryTone,
    hasTodayError,
    isNotStarted,
  });

  if (input.todayStatus === "rest-day") {
    return {
      monthPrimaryMetric: createMonthPrimaryMetric(input),
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
    monthPrimaryMetric: createMonthPrimaryMetric(input),
    monthProgressMetric: {
      actualPercent: input.monthProgressActualPercent,
      estimatedPercent: input.monthProgressEstimatedPercent,
      label: "TOTAL",
      tone: input.monthBankTone,
    },
    todayPrimaryMetric: {
      appearance: todayMetricVisualState.appearance,
      cardTone: todayMetricVisualState.primaryCardTone,
      format: "signed-duration",
      label: "Work left",
      minutes: todayPrimaryMinutes,
      tone: todayPrimaryTone,
      unit: "h",
    },
    todaySecondaryMetric: {
      appearance: todayMetricVisualState.appearance,
      cardTone: todayMetricVisualState.secondaryCardTone,
      format: "signed-duration",
      label: "Break left",
      minutes: todaySecondaryMinutes,
      tone: todaySecondaryTone,
      unit: "h",
    },
    workMode: "full",
  };
}
