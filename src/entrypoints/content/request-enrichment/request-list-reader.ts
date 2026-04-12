import type { KotRequestListRow } from "@/domain/kot/request-parser";
import {
  REQUEST_LIST_DATE_INPUT_CANDIDATES,
  REQUEST_LIST_EMPLOYEE_INPUT_CANDIDATES,
  REQUEST_LIST_ORIGINAL_CONTENT_SELECTOR,
  REQUEST_LIST_REQUESTED_CONTENT_SELECTOR,
  REQUEST_LIST_REQUEST_ID_INPUT_SELECTOR,
  REQUEST_LIST_STATUS_SELECTORS,
  REQUEST_LIST_TARGET_DATE_SELECTOR,
} from "@/entrypoints/content/request-enrichment/contracts";

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

function readLinkEmployeeIds(
  row: HTMLTableRowElement,
  baseUrl: string,
): string[] {
  const employeeIds: string[] = [];

  for (const link of row.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    try {
      const url = new URL(link.href, baseUrl);
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

function readRequestListRow(
  row: HTMLTableRowElement,
  baseUrl: string,
): KotRequestListRow {
  const originalContentText =
    row.querySelector<HTMLTableCellElement>(REQUEST_LIST_ORIGINAL_CONTENT_SELECTOR)
      ?.textContent ?? "";
  const requestedContentText =
    row.querySelector<HTMLTableCellElement>(REQUEST_LIST_REQUESTED_CONTENT_SELECTOR)
      ?.textContent ?? "";
  const targetDateText =
    row.querySelector<HTMLTableCellElement>(REQUEST_LIST_TARGET_DATE_SELECTOR)
      ?.textContent ?? "";
  const statusText =
    REQUEST_LIST_STATUS_SELECTORS.map(
      (selector) =>
        row.querySelector<HTMLTableCellElement>(selector)?.textContent ?? "",
    ).find((value) => normalizeText(value) !== "") ??
    row.textContent ??
    "";
  const requestId =
    row
      .querySelector<HTMLInputElement>(REQUEST_LIST_REQUEST_ID_INPUT_SELECTOR)
      ?.value.trim() || null;

  return {
    dateFieldValues: readInputValues(row, REQUEST_LIST_DATE_INPUT_CANDIDATES),
    employeeFieldValues: readInputValues(
      row,
      REQUEST_LIST_EMPLOYEE_INPUT_CANDIDATES,
    ),
    linkEmployeeIds: readLinkEmployeeIds(row, baseUrl),
    originalContentText: normalizeText(originalContentText),
    requestId,
    requestedContentText: normalizeText(requestedContentText),
    rowText: normalizeText(row.textContent ?? ""),
    statusText: normalizeText(statusText),
    targetDateText: normalizeText(targetDateText),
  };
}

export function readRequestListRowsFromHtml(
  html: string,
  baseUrl: string,
): KotRequestListRow[] {
  const doc = new DOMParser().parseFromString(html, "text/html");

  return Array.from(doc.querySelectorAll<HTMLTableRowElement>("tr"), (row) =>
    readRequestListRow(row, baseUrl),
  );
}
