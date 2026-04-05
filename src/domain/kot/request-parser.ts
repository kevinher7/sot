import type {
  KotRequestCacheEntry,
  KotRequestStatus,
  KotRequestSyncPayload,
  KotRequestTimePatch,
  KotTimeCorrectionRequest,
} from "./request-data";

const DATE_INPUT_CANDIDATES = [
  'input[name="working_date"]',
  'input[name="target_date"]',
  'input[name="date"]',
  'input[name*="working_date"]',
  'input[name*="target_date"]',
] as const;

const EMPLOYEE_INPUT_CANDIDATES = [
  'input[name="employee_id"]',
  'input[name*="employee_id"]',
] as const;
const REQUEST_ID_INPUT_SELECTOR = 'input[name="request_id"]';
const REQUESTED_CONTENT_SELECTOR =
  'td[data-ht-sort-index="EMPLOYEE_REQUEST_LIST_REQUESTED_CONTENT"]';
const TARGET_DATE_SELECTOR =
  'td[data-ht-sort-index="EMPLOYEE_REQUEST_LIST_TARGET_DATE"]';
const STATUS_SELECTOR = 'td[data-ht-sort-index="EMPLOYEE_REQUEST_LIST_STATUS"]';

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

function parseIsoDate(value: string): string | null {
  const normalized = value.trim();

  if (/^\d{8}$/u.test(normalized)) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }

  const match = normalized.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/u);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function parseIsoDateFromElement(element: Element): string | null {
  for (const selector of DATE_INPUT_CANDIDATES) {
    const input = element.querySelector<HTMLInputElement>(selector);
    const isoDate = parseIsoDate(input?.value ?? "");

    if (isoDate !== null) {
      return isoDate;
    }
  }

  return parseIsoDate(normalizeText(element.textContent ?? ""));
}

function parseIsoDateFromTargetDateCell(
  row: HTMLTableRowElement,
): string | null {
  const targetDateCell =
    row.querySelector<HTMLTableCellElement>(TARGET_DATE_SELECTOR);

  if (targetDateCell === null) {
    return null;
  }

  return parseIsoDate(normalizeText(targetDateCell.textContent ?? ""));
}

function parseRequestedContentText(row: HTMLTableRowElement): string {
  const requestedContentCell = row.querySelector<HTMLTableCellElement>(
    REQUESTED_CONTENT_SELECTOR,
  );

  return normalizeText(requestedContentCell?.textContent ?? "");
}

function parseStatusText(row: HTMLTableRowElement): string {
  const statusCell = row.querySelector<HTMLTableCellElement>(STATUS_SELECTOR);

  if (statusCell !== null) {
    return normalizeText(statusCell.textContent ?? "");
  }

  return normalizeText(row.textContent ?? "");
}

function parseRequestId(row: HTMLTableRowElement): string | null {
  const requestId =
    row.querySelector<HTMLInputElement>(REQUEST_ID_INPUT_SELECTOR)?.value ?? "";

  return requestId.trim() === "" ? null : requestId.trim();
}

function parseEmployeeIdFromElement(element: Element): string | null {
  for (const selector of EMPLOYEE_INPUT_CANDIDATES) {
    const input = element.querySelector<HTMLInputElement>(selector);
    const employeeId = (input?.value ?? "").trim();

    if (employeeId !== "") {
      return employeeId;
    }
  }

  for (const link of element.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    try {
      const url = new URL(link.href, window.location.origin);
      const employeeId = url.searchParams.get("employee_id")?.trim() ?? "";

      if (employeeId !== "") {
        return employeeId;
      }
    } catch {
      continue;
    }
  }

  return null;
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

function parseRequestRow(
  row: HTMLTableRowElement,
  context: KotRequestSyncPayload,
  syncedAt: number,
): KotTimeCorrectionRequest | null {
  const requestedContentText = parseRequestedContentText(row);
  const statusText = parseStatusText(row);
  const rowText = normalizeText(row.textContent ?? "");
  const text = requestedContentText === "" ? rowText : requestedContentText;

  if (text === "" || !isSupportedTimeCorrectionText(text)) {
    return null;
  }

  const isoDate =
    parseIsoDateFromTargetDateCell(row) ?? parseIsoDateFromElement(row);

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

  const employeeId = parseEmployeeIdFromElement(row) ?? context.employeeId;
  const status = parseStatus(statusText);
  const requestId = parseRequestId(row);

  return {
    cacheKey: createCacheKey(employeeId, isoDate, status, text, requestId),
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

export function parseRequestListHtml(
  html: string,
  context: KotRequestSyncPayload,
  syncedAt: number,
): KotRequestCacheEntry {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const requests = Array.from(doc.querySelectorAll<HTMLTableRowElement>("tr"))
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
