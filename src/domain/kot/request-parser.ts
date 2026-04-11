import { parseKotIsoDate } from "@/domain/kot/date";
import type {
  KotRequestCacheEntry,
  KotRequestOperation,
  KotRequestStatus,
  KotRequestSyncPayload,
  KotRequestTimeLabel,
  KotRequestTimePatch,
  KotTimeCorrectionRequest,
} from "@/domain/kot/request-data";

export type KotRequestListRow = {
  dateFieldValues: readonly string[];
  employeeFieldValues: readonly string[];
  linkEmployeeIds: readonly string[];
  originalContentText: string;
  requestId: string | null;
  requestedContentText: string;
  rowText: string;
  statusText: string;
  targetDateText: string;
};

const CLOCK_IN_REQUEST_LABEL = "出勤";
const CLOCK_OUT_REQUEST_LABEL = "退勤";
const BREAK_START_REQUEST_LABEL = "休始";
const BREAK_END_REQUEST_LABEL = "休終";
const REQUEST_TIME_LABEL_PATTERN = [
  CLOCK_IN_REQUEST_LABEL,
  CLOCK_OUT_REQUEST_LABEL,
  BREAK_START_REQUEST_LABEL,
  BREAK_END_REQUEST_LABEL,
].join("|");

const REQUEST_ENTRY_PATTERN = new RegExp(
  `(\\d{1,2}:\\d{2})\\s*\\((${REQUEST_TIME_LABEL_PATTERN})\\)`,
  "u",
);
const REQUEST_ENTRY_PATTERN_GLOBAL = new RegExp(
  `(\\d{1,2}:\\d{2})\\s*\\((${REQUEST_TIME_LABEL_PATTERN})\\)`,
  "gu",
);
const DELETE_REQUEST_PATTERN = /^削除$/u;
const PENDING_PATTERNS = [/対応中/u] as const;
const APPROVED_PATTERNS = [/承認済/u] as const;

function normalizeText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function parseClockMinutes(value: string): number | undefined {
  const match = value.match(/(\d{1,2}):(\d{2})/u);

  if (!match) {
    return undefined;
  }

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

function parseStatus(text: string): KotRequestStatus {
  if (PENDING_PATTERNS.some((pattern) => pattern.test(text))) {
    return "pending";
  }

  if (APPROVED_PATTERNS.some((pattern) => pattern.test(text))) {
    return "approved";
  }

  return "unknown";
}

function isSupportedTimeCorrectionText(text: string): boolean {
  return REQUEST_ENTRY_PATTERN.test(text);
}

function hasTimePatch(timePatch: KotRequestTimePatch): boolean {
  return (
    timePatch.clockInMinutes !== undefined ||
    timePatch.clockOutMinutes !== undefined ||
    timePatch.breakStartMinutes !== undefined ||
    timePatch.breakEndMinutes !== undefined
  );
}

function createTimePatch(text: string): KotRequestTimePatch {
  const timePatch: KotRequestTimePatch = {};

  for (const match of text.matchAll(REQUEST_ENTRY_PATTERN_GLOBAL)) {
    const minutes = parseClockMinutes(match[1] ?? "");
    const requestTimeLabel = match[2];

    if (minutes === undefined) {
      continue;
    }

    if (requestTimeLabel === CLOCK_IN_REQUEST_LABEL) {
      timePatch.clockInMinutes = minutes;
      continue;
    }

    if (requestTimeLabel === CLOCK_OUT_REQUEST_LABEL) {
      timePatch.clockOutMinutes = minutes;
      continue;
    }

    if (requestTimeLabel === BREAK_START_REQUEST_LABEL) {
      timePatch.breakStartMinutes = [
        ...(timePatch.breakStartMinutes ?? []),
        minutes,
      ];
      continue;
    }

    if (requestTimeLabel === BREAK_END_REQUEST_LABEL) {
      timePatch.breakEndMinutes = [
        ...(timePatch.breakEndMinutes ?? []),
        minutes,
      ];
    }
  }

  return timePatch;
}

function toRequestTimeLabel(value: string): KotRequestTimeLabel | null {
  if (value === CLOCK_IN_REQUEST_LABEL) {
    return "clockIn";
  }

  if (value === CLOCK_OUT_REQUEST_LABEL) {
    return "clockOut";
  }

  if (value === BREAK_START_REQUEST_LABEL) {
    return "breakStart";
  }

  if (value === BREAK_END_REQUEST_LABEL) {
    return "breakEnd";
  }

  return null;
}

function createDeleteOperation(text: string): KotRequestOperation | null {
  const matches = Array.from(text.matchAll(REQUEST_ENTRY_PATTERN_GLOBAL));

  if (matches.length !== 1) {
    return null;
  }

  const match = matches[0];
  const minutes = parseClockMinutes(match[1] ?? "");
  const label = toRequestTimeLabel(match[2] ?? "");

  if (minutes === undefined || label === null) {
    return null;
  }

  return {
    label,
    minutes,
    type: "delete",
  };
}

function createRequestOperation(
  row: KotRequestListRow,
): KotRequestOperation | null {
  const requestedContentText = normalizeText(row.requestedContentText);

  if (DELETE_REQUEST_PATTERN.test(requestedContentText)) {
    return createDeleteOperation(normalizeText(row.originalContentText));
  }

  const text =
    requestedContentText === ""
      ? normalizeText(row.rowText)
      : requestedContentText;

  if (!isSupportedTimeCorrectionText(text)) {
    return null;
  }

  const timePatch = createTimePatch(text);

  if (!hasTimePatch(timePatch)) {
    return null;
  }

  return {
    timePatch,
    type: "patch",
  };
}

function createCacheKey(
  employeeId: string,
  isoDate: string,
  status: KotRequestStatus,
  text: string,
  requestId: string | null,
): string {
  if (requestId !== null) {
    return `${employeeId}:${isoDate}:${requestId}`;
  }

  const compactText = text.toLowerCase().replace(/\s+/gu, " ").trim();

  return `${employeeId}:${isoDate}:${status}:${compactText}`;
}

function parseRowIsoDate(row: KotRequestListRow): string | null {
  const targetDate = parseKotIsoDate(row.targetDateText);

  if (targetDate !== null) {
    return targetDate;
  }

  for (const value of row.dateFieldValues) {
    const isoDate = parseKotIsoDate(value);

    if (isoDate !== null) {
      return isoDate;
    }
  }

  return parseKotIsoDate(row.rowText);
}

function parseEmployeeId(
  row: KotRequestListRow,
  fallbackEmployeeId: string,
): string {
  for (const value of [...row.employeeFieldValues, ...row.linkEmployeeIds]) {
    const trimmed = value.trim();

    if (trimmed !== "") {
      return trimmed;
    }
  }

  return fallbackEmployeeId;
}

function parseRequestRow(
  row: KotRequestListRow,
  context: KotRequestSyncPayload,
  syncedAt: number,
): KotTimeCorrectionRequest | null {
  const requestedContentText = normalizeText(row.requestedContentText);
  const statusText = normalizeText(row.statusText);
  const rowText = normalizeText(row.rowText);
  const cacheText =
    requestedContentText === "" ? rowText : requestedContentText;

  if (cacheText === "") {
    return null;
  }

  const isoDate = parseRowIsoDate(row);

  if (
    isoDate === null ||
    !isoDate.startsWith(
      `${context.year}-${context.month.toString().padStart(2, "0")}`,
    )
  ) {
    return null;
  }

  const operation = createRequestOperation(row);

  if (operation === null) {
    return null;
  }

  const employeeId = parseEmployeeId(row, context.employeeId);
  const status = parseStatus(statusText);

  return {
    cacheKey: createCacheKey(
      employeeId,
      isoDate,
      status,
      cacheText,
      row.requestId,
    ),
    employeeId,
    isoDate,
    label: rowText,
    operation,
    status,
    updatedAt: syncedAt,
  };
}

function createOperationSignature(operation: KotRequestOperation): string {
  if (operation.type === "delete") {
    return ["delete", operation.label, operation.minutes].join("|");
  }

  const breakStart = operation.timePatch.breakStartMinutes?.join(",") ?? "-";
  const breakEnd = operation.timePatch.breakEndMinutes?.join(",") ?? "-";

  return [
    "patch",
    operation.timePatch.clockInMinutes ?? "-",
    operation.timePatch.clockOutMinutes ?? "-",
    breakStart,
    breakEnd,
  ].join("|");
}

function createSignature(
  requests: readonly KotTimeCorrectionRequest[],
): string {
  return requests
    .map((request) => {
      return [
        request.cacheKey,
        request.isoDate,
        request.status,
        createOperationSignature(request.operation),
      ].join("|");
    })
    .join(";");
}

export function parseRequestListRows(
  rows: readonly KotRequestListRow[],
  context: KotRequestSyncPayload,
  syncedAt: number,
): KotRequestCacheEntry {
  const requests = rows
    .map((row) => parseRequestRow(row, context, syncedAt))
    .filter((request): request is KotTimeCorrectionRequest => request !== null)
    .sort((left, right) => {
      const dateCompare = left.isoDate.localeCompare(right.isoDate);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return left.cacheKey.localeCompare(right.cacheKey);
    });

  return {
    employeeId: context.employeeId,
    month: context.month,
    requests,
    signature: createSignature(requests),
    syncedAt,
    year: context.year,
  };
}
