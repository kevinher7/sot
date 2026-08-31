import type { KotDayRowSnapshot } from "@/domain/kot/monthly-page-types";
import type {
  KotRequestCacheEntry,
  KotRequestOperation,
  KotRequestTimeLabel,
  KotTimeCorrectionRequest,
} from "@/domain/kot/request-data";
import { createKotRequestOperationSignature } from "@/domain/kot/request-operation-signature";

type SimulatedDayRow = {
  breakEndMinutes: number[];
  breakStartMinutes: number[];
  clockInMinutes: number | null;
  clockOutMinutes: number | null;
};

function createRequestMap(
  requestCacheEntry: KotRequestCacheEntry | null,
): ReadonlyMap<string, readonly KotTimeCorrectionRequest[]> {
  const grouped = new Map<string, KotTimeCorrectionRequest[]>();

  requestCacheEntry?.requests.forEach((request) => {
    if (request.status !== "pending") {
      return;
    }

    const existing = grouped.get(request.isoDate) ?? [];

    existing.push(request);
    grouped.set(request.isoDate, existing);
  });

  return grouped;
}

function createSimulatedDayRow(row: KotDayRowSnapshot): SimulatedDayRow {
  return {
    breakEndMinutes: [...row.breakEndMinutes],
    breakStartMinutes: [...row.breakStartMinutes],
    clockInMinutes: row.clockInMinutes,
    clockOutMinutes: row.clockOutMinutes,
  };
}

// The recorded punches a request competes for: the entries it supersedes, plus
// the single clock-in / clock-out slot it overwrites. Break punches a request
// only adds claim nothing, so two requests editing different break punches on
// the same day stay compatible.
function collectClaimedPunches(
  operation: KotRequestOperation,
): readonly string[] {
  if (operation.type === "delete") {
    return [`${operation.label}:${operation.minutes}`];
  }

  const claimed = operation.supersededEntries.map(
    (entry) => `${entry.label}:${entry.minutes}`,
  );

  if (operation.timePatch.clockInMinutes !== undefined) {
    claimed.push("clockIn");
  }

  if (operation.timePatch.clockOutMinutes !== undefined) {
    claimed.push("clockOut");
  }

  return claimed;
}

function removeMinute(list: number[], minutes: number): boolean {
  const index = list.indexOf(minutes);

  if (index < 0) {
    return false;
  }

  list.splice(index, 1);

  return true;
}

function applyDeleteOperation(
  row: SimulatedDayRow,
  operation: Extract<KotRequestOperation, { type: "delete" }>,
): boolean {
  if (operation.label === "clockIn") {
    if (row.clockInMinutes !== operation.minutes) {
      return false;
    }

    row.clockInMinutes = null;

    return true;
  }

  if (operation.label === "clockOut") {
    if (row.clockOutMinutes !== operation.minutes) {
      return false;
    }

    row.clockOutMinutes = null;

    return true;
  }

  if (operation.label === "breakStart") {
    return removeMinute(row.breakStartMinutes, operation.minutes);
  }

  return removeMinute(row.breakEndMinutes, operation.minutes);
}

function addBreakMinutes(
  current: readonly number[],
  requested: readonly number[],
): number[] {
  return [...current, ...requested].sort((a, b) => a - b);
}

function removeSupersededEntries(
  row: SimulatedDayRow,
  supersededEntries: readonly { label: KotRequestTimeLabel; minutes: number }[],
): void {
  for (const entry of supersededEntries) {
    if (entry.label === "clockIn") {
      if (row.clockInMinutes === entry.minutes) {
        row.clockInMinutes = null;
      }

      continue;
    }

    if (entry.label === "clockOut") {
      if (row.clockOutMinutes === entry.minutes) {
        row.clockOutMinutes = null;
      }

      continue;
    }

    if (entry.label === "breakStart") {
      removeMinute(row.breakStartMinutes, entry.minutes);
      continue;
    }

    removeMinute(row.breakEndMinutes, entry.minutes);
  }
}

function applyPatchOperation(
  row: SimulatedDayRow,
  operation: Extract<KotRequestOperation, { type: "patch" }>,
): void {
  removeSupersededEntries(row, operation.supersededEntries);

  if (operation.timePatch.clockInMinutes !== undefined) {
    row.clockInMinutes = operation.timePatch.clockInMinutes;
  }

  if (operation.timePatch.clockOutMinutes !== undefined) {
    row.clockOutMinutes = operation.timePatch.clockOutMinutes;
  }

  if (operation.timePatch.breakStartMinutes !== undefined) {
    row.breakStartMinutes = addBreakMinutes(
      row.breakStartMinutes,
      operation.timePatch.breakStartMinutes,
    );
  }

  if (operation.timePatch.breakEndMinutes !== undefined) {
    row.breakEndMinutes = addBreakMinutes(
      row.breakEndMinutes,
      operation.timePatch.breakEndMinutes,
    );
  }
}

function applyRequestOperation(
  row: SimulatedDayRow,
  claimedPunches: Set<string>,
  operation: KotRequestOperation,
): boolean {
  const claimed = collectClaimedPunches(operation);

  if (claimed.some((punch) => claimedPunches.has(punch))) {
    return false;
  }

  claimed.forEach((punch) => claimedPunches.add(punch));

  if (operation.type === "delete") {
    return applyDeleteOperation(row, operation);
  }

  applyPatchOperation(row, operation);

  return true;
}

export function createKotPendingRequestMap(
  requestCacheEntry: KotRequestCacheEntry | null,
): ReadonlyMap<string, readonly KotTimeCorrectionRequest[]> {
  return createRequestMap(requestCacheEntry);
}

export function applyKotRequestsToDayRow(
  row: KotDayRowSnapshot,
  requests: readonly KotTimeCorrectionRequest[] | undefined,
): KotDayRowSnapshot | null {
  if (requests === undefined || requests.length === 0) {
    return null;
  }

  const simulatedRow = createSimulatedDayRow(row);
  const claimedPunches = new Set<string>();
  const appliedSignatures = new Set<string>();

  for (const request of requests) {
    const signature = createKotRequestOperationSignature(request.operation);

    // A resubmitted 二重申請 lands the same punches wherever it is approved.
    if (appliedSignatures.has(signature)) {
      continue;
    }

    appliedSignatures.add(signature);

    if (
      !applyRequestOperation(simulatedRow, claimedPunches, request.operation)
    ) {
      return null;
    }
  }

  return {
    ...row,
    breakEndMinutes: simulatedRow.breakEndMinutes,
    breakStartMinutes: simulatedRow.breakStartMinutes,
    clockInMinutes: simulatedRow.clockInMinutes,
    clockOutMinutes: simulatedRow.clockOutMinutes,
    hasError: false,
  };
}
