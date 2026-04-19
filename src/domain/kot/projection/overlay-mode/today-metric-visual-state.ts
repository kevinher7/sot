import type {
  OverlayDurationMetricProjection,
  OverlayMetricAppearance,
} from "@/domain/kot/projection/overlay-mode/types";

export type TodayMetricVisualState = {
  appearance: OverlayMetricAppearance;
  primaryCardTone: OverlayDurationMetricProjection["cardTone"];
  secondaryCardTone: OverlayDurationMetricProjection["cardTone"];
};

export function createTodayMetricVisualState(input: {
  activePrimaryCardTone: OverlayDurationMetricProjection["cardTone"];
  activeSecondaryCardTone: OverlayDurationMetricProjection["cardTone"];
  hasTodayError: boolean;
  isNotStarted: boolean;
}): TodayMetricVisualState {
  if (!input.isNotStarted) {
    return {
      appearance: "default",
      primaryCardTone: input.activePrimaryCardTone,
      secondaryCardTone: input.activeSecondaryCardTone,
    };
  }

  if (input.hasTodayError) {
    return {
      appearance: "default",
      primaryCardTone: "error",
      secondaryCardTone: "error",
    };
  }

  return {
    appearance: "subtle",
    primaryCardTone: "neutral",
    secondaryCardTone: "neutral",
  };
}
