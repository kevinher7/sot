import { parseKotIsoDate } from "./date";
import type {
  KotRequestCacheEntry,
  KotRequestStatus,
  KotRequestSyncPayload,
  KotRequestTimePatch,
  KotTimeCorrectionRequest,
} from "./request-data";

export type KotRequestListRow = {
  dateFieldValues: readonly string[];
  employeeFieldValues: readonly string[];
  linkEmployeeIds: readonly string[];
  requestId: string | null;
  requestedContentText: string;
  rowText: string;
  statusText: string;
  targetDateText: string;
};

const CLOCK_IN_PATTERNS = [
  /(?:出勤|出社|始業)[^0-9]{0,20}(\d{1,2}:\d{2})/u,
  /(\d{1,2}:\d{2})[^()\n]{0,20}\((?:出勤|出社|始業)\)/u,
] as const;
const CLOCK_OUT_PATTERNS = [
  /(?:退勤|退社|終業)[^0-9]{0,20}(\d{1,2}:\d{2})/u,
  /(\d{1,2}:\d{2})[^()\n]{0,20}\((?:退勤|退社|終業)\)/u,
] as const;
const BREAK_START_PATTERNS = [
  /(?:休憩開始|外出開始)[^0-9]{0,20}(\d{1,2}:\d{2})/gu,
  /(\d{1,2}:\d{2})[^()\n]{0,20}\((?:休始|休憩開始|外出開始)\)/gu,
] as const;
const BREAK_END_PATTERNS = [
  /(?:休憩終了|外出終了)[^0-9]{0,20}(\d{1,2}:\d{2})/gu,
  /(\d{1,2}:\d{2})[^()\n]{0,20}\((?:休終|休憩終了|外出終了)\)/gu,
] as const;
const SUPPORTED_TYPE_PATTERNS = [
  /打刻/u,
  /出勤/u,
  /退勤/u,
  /出社/u,
  /退社/u,
  /始業/u,
  /終業/u,
  /休憩/u,
  /休始/u,
  /休終/u,
] as const;
const PENDING_PATTERNS = [
  /申請中/u,
  /承認待ち/u,
  /未承認/u,
  /処理待ち/u,
  /対応中/u,
] as const;
const APPROVED_PATTERNS = [/承認済/u, /承認完了/u] as const;
const REJECTED_PATTERNS = [/却下/u, /棄却/u] as const;
const CANCELLED_PATTERNS = [/取消/u, /キャンセル/u] as const;

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

function parseClockMinutesByPatterns(
  text: string,
  patterns: readonly RegExp[],
): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return parseClockMinutes(match[1]);
    }
  }

  return undefined;
}

function parseClockMinuteListByPatterns(
  text: string,
  patterns: readonly RegExp[],
): number[] | undefined {
  const minutes: number[] = [];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const minuteValue = parseClockMinutes(match[1] ?? "");

      if (minuteValue !== undefined) {
        minutes.push(minuteValue);
      }
    }
  }

  return minutes.length > 0 ? minutes : undefined;
}

function parseStatus(text: string): KotRequestStatus {
  if (PENDING_PATTERNS.some((pattern) => pattern.test(text))) {
    return "pending";
  }

  if (APPROVED_PATTERNS.some((pattern) => pattern.test(text))) {
    return "approved";
  }

  if (REJECTED_PATTERNS.some((pattern) => pattern.test(text))) {
    return "rejected";
  }

  if (CANCELLED_PATTERNS.some((pattern) => pattern.test(text))) {
    return "cancelled";
  }

  return "unknown";
}

function isSupportedTimeCorrectionText(text: string): boolean {
  return SUPPORTED_TYPE_PATTERNS.some((pattern) => pattern.test(text));
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
  return {
    breakEndMinutes: parseClockMinuteListByPatterns(text, BREAK_END_PATTERNS),
    breakStartMinutes: parseClockMinuteListByPatterns(
      text,
      BREAK_START_PATTERNS,
    ),
    clockInMinutes: parseClockMinutesByPatterns(text, CLOCK_IN_PATTERNS),
    clockOutMinutes: parseClockMinutesByPatterns(text, CLOCK_OUT_PATTERNS),
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
  const text = requestedContentText === "" ? rowText : requestedContentText;

  if (text === "" || !isSupportedTimeCorrectionText(text)) {
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

  const timePatch = createTimePatch(text);

  if (!hasTimePatch(timePatch)) {
    return null;
  }

  const employeeId = parseEmployeeId(row, context.employeeId);
  const status = parseStatus(statusText);

  return {
    cacheKey: createCacheKey(employeeId, isoDate, status, text, row.requestId),
    employeeId,
    isoDate,
    label: rowText,
    status,
    timePatch,
    updatedAt: syncedAt,
  };
}

function createSignature(
  requests: readonly KotTimeCorrectionRequest[],
): string {
  return requests
    .map((request) => {
      const breakStart = request.timePatch.breakStartMinutes?.join(",") ?? "-";
      const breakEnd = request.timePatch.breakEndMinutes?.join(",") ?? "-";

      return [
        request.cacheKey,
        request.isoDate,
        request.status,
        request.timePatch.clockInMinutes ?? "-",
        request.timePatch.clockOutMinutes ?? "-",
        breakStart,
        breakEnd,
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
