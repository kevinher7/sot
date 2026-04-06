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
  errorCount: number;
  warningCount: number;
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
): { breakMinutes: number; errorCount: number } | null {
  if (breakEndMinutes.length > breakStartMinutes.length) {
    return null;
  }

  let totalBreakMinutes = 0;
  let errorCount = 0;
  let startIndex = 0;
  let endIndex = 0;
  let activeBreakStartMinute: number | null = null;

  while (
    startIndex < breakStartMinutes.length ||
    activeBreakStartMinute !== null
  ) {
    if (activeBreakStartMinute === null) {
      const breakStartMinute = breakStartMinutes[startIndex];

      if (breakStartMinute === undefined) {
        break;
      }

      activeBreakStartMinute = breakStartMinute;
      startIndex += 1;
      continue;
    }

    const nextBreakStartMinute = breakStartMinutes[startIndex];
    const nextBreakEndMinute = breakEndMinutes[endIndex];

    if (nextBreakEndMinute === undefined) {
      if (nextBreakStartMinute !== undefined) {
        errorCount += 1;
        startIndex += 1;
        continue;
      }

      if (!treatIncompleteAsOngoing) {
        return null;
      }

      totalBreakMinutes += Math.max(
        normalizeEndMinutes(activeBreakStartMinute, nowMinutes) -
          activeBreakStartMinute,
        0,
      );
      activeBreakStartMinute = null;
      continue;
    }

    if (nextBreakStartMinute !== undefined) {
      const normalizedBreakStartMinute = normalizeEndMinutes(
        activeBreakStartMinute,
        nextBreakStartMinute,
      );
      const normalizedBreakEndMinute = normalizeEndMinutes(
        activeBreakStartMinute,
        nextBreakEndMinute,
      );

      if (normalizedBreakStartMinute < normalizedBreakEndMinute) {
        errorCount += 1;
        startIndex += 1;
        continue;
      }
    }

    totalBreakMinutes += Math.max(
      normalizeEndMinutes(activeBreakStartMinute, nextBreakEndMinute) -
        activeBreakStartMinute,
      0,
    );
    activeBreakStartMinute = null;
    endIndex += 1;
  }

  if (endIndex < breakEndMinutes.length) {
    return null;
  }

  return {
    breakMinutes: totalBreakMinutes,
    errorCount,
  };
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

  const breakOutcome = deriveBreakMinutes(
    input.breakStartMinutes,
    input.breakEndMinutes,
    input.nowMinutes,
    input.treatIncompleteAsOngoing,
  );

  if (breakOutcome === null) {
    return null;
  }

  const workedSpanMinutes = Math.max(
    normalizeEndMinutes(input.clockInMinutes, effectiveClockOutMinutes) -
      input.clockInMinutes,
    0,
  );

  return {
    breakMinutes: breakOutcome.breakMinutes,
    errorCount: breakOutcome.errorCount,
    warningCount: 0,
    workedMinutes: Math.max(workedSpanMinutes - breakOutcome.breakMinutes, 0),
  };
}
