import type { KotDayRowSnapshot } from "@/domain/kot/monthly-page-types";
import type { KotTimeCorrectionRequest } from "@/domain/kot/request-data";
import type { KotDayScenarioInput } from "@/domain/kot/calculation/day/calculation-types";
import { createKotRequestConflictResult } from "@/domain/kot/calculation/requests/request-conflict";
import { applyKotRequestsToDayRow } from "@/domain/kot/calculation/requests/request-simulation";

export function buildActualDayScenario(
  row: KotDayRowSnapshot,
): KotDayScenarioInput {
  return {
    interpretedRow: row,
    kind: "actual",
    requestState: "none",
    sourceRow: row,
  };
}

export function buildEffectiveDayScenario(
  row: KotDayRowSnapshot,
  pendingRequests: readonly KotTimeCorrectionRequest[] | undefined,
): KotDayScenarioInput {
  const simulatedRow = applyKotRequestsToDayRow(row, pendingRequests);
  const requestResult = createKotRequestConflictResult({
    requests: pendingRequests,
    row,
    simulatedRow,
  });

  return {
    interpretedRow: requestResult.interpretedRow,
    kind: "effective",
    requestState: requestResult.requestState,
    sourceRow: row,
  };
}

export function buildDayScenarios(
  row: KotDayRowSnapshot,
  pendingRequests: readonly KotTimeCorrectionRequest[] | undefined,
): {
  actual: KotDayScenarioInput;
  effective: KotDayScenarioInput;
} {
  return {
    actual: buildActualDayScenario(row),
    effective: buildEffectiveDayScenario(row, pendingRequests),
  };
}
