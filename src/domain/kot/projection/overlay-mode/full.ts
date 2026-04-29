import type {
  OverlayDurationMetricProjection,
  OverlayDurationMetricViewBinding,
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

function createElapsedTone(
  minutes: number,
): OverlayDurationMetricProjection["tone"] {
  return minutes > 0 ? "positive" : "neutral";
}

function createMonthPrimaryMetric(
  input: OverlayModeProjectionInput,
): OverlayDurationMetricProjection {
  if (input.metricViews.monthBank === "estimated") {
    const binding: OverlayDurationMetricViewBinding = {
      nextView: "actual",
      viewKey: "monthBank",
    };

    return {
      appearance: "default",
      cardTone: "warning",
      format: "signed-duration",
      label: "Bank est.",
      minutes: input.monthBankEstimatedMinutes,
      tone: createSignedTone(input.monthBankEstimatedMinutes),
      unit: "h",
      viewBinding: binding,
    };
  }

  const binding: OverlayDurationMetricViewBinding = {
    nextView: "estimated",
    viewKey: "monthBank",
  };

  return {
    appearance: "default",
    cardTone: input.monthBankTone,
    format: "signed-duration",
    label: "Bank",
    minutes: input.monthBankMinutes,
    tone: createSignedTone(input.monthBankMinutes),
    unit: "h",
    viewBinding: binding,
  };
}

export function projectFullOverlayMode(
  input: OverlayModeProjectionInput,
): OverlayModeProjectionResult {
  if (input.todayStatus === "rest-day") {
    return {
      monthPrimaryMetric: createMonthPrimaryMetric(input),
      todayPrimaryMetric: createRestDayMetric("Work left"),
      todaySecondaryMetric: createRestDayMetric("Break left"),
      workMode: "full",
    };
  }

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

  const workTodayBinding: OverlayDurationMetricViewBinding = {
    nextView: input.metricViews.workToday === "elapsed" ? "left" : "elapsed",
    viewKey: "workToday",
  };
  const breakTodayBinding: OverlayDurationMetricViewBinding = {
    nextView: input.metricViews.breakToday === "elapsed" ? "left" : "elapsed",
    viewKey: "breakToday",
  };

  const todayPrimaryMetric: OverlayDurationMetricProjection =
    input.metricViews.workToday === "elapsed"
      ? {
          appearance: todayMetricVisualState.appearance,
          cardTone: todayMetricVisualState.primaryCardTone,
          format: "unsigned-duration",
          label: "Work time",
          minutes: input.todayWorkedMinutes,
          tone: createElapsedTone(input.todayWorkedMinutes),
          unit: "h",
          viewBinding: workTodayBinding,
        }
      : {
          appearance: todayMetricVisualState.appearance,
          cardTone: todayMetricVisualState.primaryCardTone,
          format: "signed-duration",
          label: "Work left",
          minutes: todayPrimaryMinutes,
          tone: todayPrimaryTone,
          unit: "h",
          viewBinding: workTodayBinding,
        };

  const todaySecondaryMetric: OverlayDurationMetricProjection =
    input.metricViews.breakToday === "elapsed"
      ? {
          appearance: todayMetricVisualState.appearance,
          cardTone: hasTodayError
            ? input.todayBreakMetricCardTone
            : todayMetricVisualState.secondaryCardTone,
          format: "unsigned-duration",
          label: "Break took",
          minutes: input.todayBreakMinutes,
          tone: createElapsedTone(input.todayBreakMinutes),
          unit: "h",
          viewBinding: breakTodayBinding,
        }
      : {
          appearance: todayMetricVisualState.appearance,
          cardTone: todayMetricVisualState.secondaryCardTone,
          format: "signed-duration",
          label: "Break left",
          minutes: todaySecondaryMinutes,
          tone: todaySecondaryTone,
          unit: "h",
          viewBinding: breakTodayBinding,
        };

  return {
    monthPrimaryMetric: createMonthPrimaryMetric(input),
    todayPrimaryMetric,
    todaySecondaryMetric,
    workMode: "full",
  };
}
