export type DeriveWorkedMinutesInput = {
  breakEndMinutes: readonly number[];
  breakStartMinutes: readonly number[];
  clockInMinutes: number | null;
  clockOutMinutes: number | null;
  nowMinutes: number;
  treatIncompleteAsOngoing: boolean;
};

export type DerivedWorkedMinutes = {
  breakMinutes: number;
  workedMinutes: number;
};

function normalizeEndMinutes(startMinutes: number, endMinutes: number): number {
  if (endMinutes < startMinutes) {
    return endMinutes + 24 * 60;
  }

  return endMinutes;
}

function deriveBreakMinutes(
  breakStartMinutes: readonly number[],
  breakEndMinutes: readonly number[],
  nowMinutes: number,
  treatIncompleteAsOngoing: boolean,
): number | null {
  if (breakEndMinutes.length > breakStartMinutes.length) {
    return null;
  }

  let totalBreakMinutes = 0;

  for (const [index, breakStartMinute] of breakStartMinutes.entries()) {
    const breakEndMinute = breakEndMinutes[index];

    if (breakEndMinute === undefined) {
      if (!treatIncompleteAsOngoing) {
        return null;
      }

      totalBreakMinutes += Math.max(
        normalizeEndMinutes(breakStartMinute, nowMinutes) - breakStartMinute,
        0,
      );
      continue;
    }

    totalBreakMinutes += Math.max(
      normalizeEndMinutes(breakStartMinute, breakEndMinute) - breakStartMinute,
      0,
    );
  }

  return totalBreakMinutes;
}

export function deriveWorkedMinutes(
  input: DeriveWorkedMinutesInput,
): DerivedWorkedMinutes | null {
  if (input.clockInMinutes === null) {
    return null;
  }

  const effectiveClockOutMinutes =
    input.clockOutMinutes ??
    (input.treatIncompleteAsOngoing ? input.nowMinutes : null);

  if (effectiveClockOutMinutes === null) {
    return null;
  }

  const breakMinutes = deriveBreakMinutes(
    input.breakStartMinutes,
    input.breakEndMinutes,
    input.nowMinutes,
    input.treatIncompleteAsOngoing,
  );

  if (breakMinutes === null) {
    return null;
  }

  const workedSpanMinutes = Math.max(
    normalizeEndMinutes(input.clockInMinutes, effectiveClockOutMinutes) -
      input.clockInMinutes,
    0,
  );

  return {
    breakMinutes,
    workedMinutes: Math.max(workedSpanMinutes - breakMinutes, 0),
  };
}
