import type { KotRequestListRow } from "@/domain/kot/request-parser";

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

function normalizeText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function readInputValues(
  row: HTMLTableRowElement,
  selectors: readonly string[],
): string[] {
  return selectors.flatMap((selector) =>
    Array.from(
      row.querySelectorAll<HTMLInputElement>(selector),
      (input) => input.value,
    ),
  );
}

function readLinkEmployeeIds(row: HTMLTableRowElement): string[] {
  const employeeIds: string[] = [];

  for (const link of row.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    try {
      const url = new URL(link.href, window.location.origin);
      const employeeId = url.searchParams.get("employee_id")?.trim() ?? "";

      if (employeeId !== "") {
        employeeIds.push(employeeId);
      }
    } catch {
      continue;
    }
  }

  return employeeIds;
}

function readRequestListRow(row: HTMLTableRowElement): KotRequestListRow {
  const requestedContentText =
    row.querySelector<HTMLTableCellElement>(REQUESTED_CONTENT_SELECTOR)
      ?.textContent ?? "";
  const targetDateText =
    row.querySelector<HTMLTableCellElement>(TARGET_DATE_SELECTOR)
      ?.textContent ?? "";
  const statusText =
    row.querySelector<HTMLTableCellElement>(STATUS_SELECTOR)?.textContent ??
    row.textContent ??
    "";
  const requestId =
    row
      .querySelector<HTMLInputElement>(REQUEST_ID_INPUT_SELECTOR)
      ?.value.trim() || null;

  return {
    dateFieldValues: readInputValues(row, DATE_INPUT_CANDIDATES),
    employeeFieldValues: readInputValues(row, EMPLOYEE_INPUT_CANDIDATES),
    linkEmployeeIds: readLinkEmployeeIds(row),
    requestId,
    requestedContentText: normalizeText(requestedContentText),
    rowText: normalizeText(row.textContent ?? ""),
    statusText: normalizeText(statusText),
    targetDateText: normalizeText(targetDateText),
  };
}

export function readRequestListRowsFromHtml(html: string): KotRequestListRow[] {
  const doc = new DOMParser().parseFromString(html, "text/html");

  return Array.from(doc.querySelectorAll<HTMLTableRowElement>("tr"), (row) =>
    readRequestListRow(row),
  );
}
