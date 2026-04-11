import type { KotDayRowSnapshot } from "../monthly-page-types";
import type {
  KotRequestCacheEntry,
  KotRequestOperation,
  KotTimeCorrectionRequest,
} from "../request-data";

type SimulatedDayRow = {
  breakEndMinutes: number[];
  breakStartMinutes: number[];
  clockInMinutes: number | null;
  clockOutMinutes: number | null;
};

type RequestFieldKey = "breakEnd" | "breakStart" | "clockIn" | "clockOut";

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

function createCompatibilityKey(
  operation: KotRequestOperation,
  field: RequestFieldKey,
): string {
  if (operation.type === "delete") {
    return `delete:${operation.minutes}`;
  }

  if (field === "clockIn") {
    return `patch:${operation.timePatch.clockInMinutes ?? "-"}`;
  }

  if (field === "clockOut") {
    return `patch:${operation.timePatch.clockOutMinutes ?? "-"}`;
  }

  if (field === "breakStart") {
    return `patch:${operation.timePatch.breakStartMinutes?.join(",") ?? "-"}`;
  }

  return `patch:${operation.timePatch.breakEndMinutes?.join(",") ?? "-"}`;
}

function markFieldOperation(
  fieldStates: Map<RequestFieldKey, string>,
  operation: KotRequestOperation,
  field: RequestFieldKey,
): boolean {
  const nextKey = createCompatibilityKey(operation, field);
  const currentKey = fieldStates.get(field);

  if (currentKey === undefined) {
    fieldStates.set(field, nextKey);

    return true;
  }

  if (currentKey === nextKey) {
    return true;
  }

  if (
    (field === "breakStart" || field === "breakEnd") &&
    currentKey.startsWith("delete:") &&
    nextKey.startsWith("delete:")
  ) {
    return true;
  }

  return false;
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

function applyPatchOperation(
  row: SimulatedDayRow,
  operation: Extract<KotRequestOperation, { type: "patch" }>,
): void {
  if (operation.timePatch.clockInMinutes !== undefined) {
    row.clockInMinutes = operation.timePatch.clockInMinutes;
  }

  if (operation.timePatch.clockOutMinutes !== undefined) {
    row.clockOutMinutes = operation.timePatch.clockOutMinutes;
  }

  if (operation.timePatch.breakStartMinutes !== undefined) {
    row.breakStartMinutes = [...operation.timePatch.breakStartMinutes];
  }

  if (operation.timePatch.breakEndMinutes !== undefined) {
    row.breakEndMinutes = [...operation.timePatch.breakEndMinutes];
  }
}

function applyRequestOperation(
  row: SimulatedDayRow,
  fieldStates: Map<RequestFieldKey, string>,
  operation: KotRequestOperation,
): boolean {
  if (operation.type === "delete") {
    if (!markFieldOperation(fieldStates, operation, operation.label)) {
      return false;
    }

    return applyDeleteOperation(row, operation);
  }

  const affectedFields: RequestFieldKey[] = [];

  if (operation.timePatch.clockInMinutes !== undefined) {
    affectedFields.push("clockIn");
  }

  if (operation.timePatch.clockOutMinutes !== undefined) {
    affectedFields.push("clockOut");
  }

  if (operation.timePatch.breakStartMinutes !== undefined) {
    affectedFields.push("breakStart");
  }

  if (operation.timePatch.breakEndMinutes !== undefined) {
    affectedFields.push("breakEnd");
  }

  if (
    !affectedFields.every((field) =>
      markFieldOperation(fieldStates, operation, field),
    )
  ) {
    return false;
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
  const fieldStates = new Map<RequestFieldKey, string>();

  for (const request of requests) {
    if (!applyRequestOperation(simulatedRow, fieldStates, request.operation)) {
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
