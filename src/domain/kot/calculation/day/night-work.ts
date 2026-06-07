/**
 * Late-night work is any worked time at or after 22:00. It is tracked
 * separately because some organizations exclude it from the monthly
 * worked-hours bank (it counts toward 深夜/overtime instead).
 *
 * Only the 22:00 boundary is modelled: shifts are assumed not to cross
 * midnight, so there is no 05:00 handoff. Malformed inputs clamp to 0.
 */
export const NIGHT_WORK_START_MINUTES = 22 * 60;

export type CalculateLateNightMinutesInput = {
  breakEndMinutes: readonly number[];
  breakStartMinutes: readonly number[];
  clockInMinutes: number;
  endMinutes: number;
};

/**
 * Minutes worked in the night window: `(work ∩ [22:00, end]) − (breaks ∩
 * [22:00, end])`. `endMinutes` is the clock-out time, or "now" for an
 * ongoing estimate. Breaks before 22:00 are intentionally not subtracted
 * here — they already reduce the pre-22:00 portion via the day's total
 * break minutes, so subtracting them again would double-penalize.
 *
 * The break pairing mirrors `calculateKotBreaks`; it is kept local to
 * avoid coupling night-window math to that function's issue reporting.
 */
export function calculateLateNightMinutes(
  input: CalculateLateNightMinutesInput,
): number {
  const { breakEndMinutes, breakStartMinutes, clockInMinutes, endMinutes } =
    input;

  if (endMinutes <= NIGHT_WORK_START_MINUTES || endMinutes <= clockInMinutes) {
    return 0;
  }

  const nightWindowStart = Math.max(clockInMinutes, NIGHT_WORK_START_MINUTES);
  const nightWorkSpan = endMinutes - nightWindowStart;

  const pairCount = Math.min(breakStartMinutes.length, breakEndMinutes.length);
  let nightBreakMinutes = 0;

  for (let index = 0; index < pairCount; index += 1) {
    const breakStart = breakStartMinutes[index];
    const breakEnd = breakEndMinutes[index];

    if (breakStart === undefined || breakEnd === undefined) {
      continue;
    }

    if (breakEnd <= breakStart) {
      continue;
    }

    const overlapStart = Math.max(breakStart, nightWindowStart);
    const overlapEnd = Math.min(breakEnd, endMinutes);

    nightBreakMinutes += Math.max(overlapEnd - overlapStart, 0);
  }

  return Math.max(nightWorkSpan - nightBreakMinutes, 0);
}
