import type { KotDayRequestState } from "@/domain/kot/calculation/day/calculation-types";
import type { KotDayRowSnapshot } from "@/domain/kot/monthly-page-types";

export function createKotRequestConflictResult(input: {
  requests: readonly unknown[] | undefined;
  row: KotDayRowSnapshot;
  simulatedRow: KotDayRowSnapshot | null;
}): {
  interpretedRow: KotDayRowSnapshot;
  requestState: KotDayRequestState;
} {
  if (input.simulatedRow !== null) {
    return {
      interpretedRow: input.simulatedRow,
      requestState: "applied",
    };
  }

  if (input.requests !== undefined && input.requests.length > 0) {
    return {
      interpretedRow: input.row,
      requestState: "conflict",
    };
  }

  return {
    interpretedRow: input.row,
    requestState: "none",
  };
}
