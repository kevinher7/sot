import type {
  KotRequestCacheEntry,
  KotRequestSyncPayload,
} from "../../domain/kot/request-data";
import { parseRequestListHtml } from "../../domain/kot/request-parser";
import type { KotMonthlyPageSnapshot } from "../../domain/kot/overlay-calculations";
import {
  getCachedRequestEntry,
  setCachedRequestEntry,
} from "../../platform/webext/storage";

const EMPLOYEE_ID_SELECTORS = [
  'input[name="employee_id"]',
  'input[name*="employee_id"]',
  'select[name="employee_id"]',
  'select[name*="employee_id"]',
] as const;

export type KotRequestContext = {
  key: string;
  payload: KotRequestSyncPayload;
};

function createRequestListUrl(payload: KotRequestSyncPayload): string {
  const url = new URL(payload.adminBaseUrl);

  Object.entries(payload.preserveQueryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  url.searchParams.set("page_id", "/employee/request_list");
  url.searchParams.set("employee_id", payload.employeeId);
  url.searchParams.delete("call_from");
  url.searchParams.delete("date_selection_type");

  return url.toString();
}

function createPreservedQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    if (key === "page_id" || key === "employee_id") {
      return;
    }

    params[key] = value;
  });

  return params;
}

function parseEmployeeIdFromDocument(doc: Document): string | null {
  for (const selector of EMPLOYEE_ID_SELECTORS) {
    const field = doc.querySelector<HTMLInputElement | HTMLSelectElement>(
      selector,
    );
    const value = field?.value?.trim() ?? "";

    if (value !== "") {
      return value;
    }
  }

  for (const link of doc.querySelectorAll<HTMLAnchorElement>("a[href]")) {
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

function parseEmployeeId(url: URL, doc: Document): string | null {
  const fromUrl = url.searchParams.get("employee_id")?.trim() ?? "";

  if (fromUrl !== "") {
    return fromUrl;
  }

  return parseEmployeeIdFromDocument(doc);
}

export function createKotRequestContext(
  pageSnapshot: KotMonthlyPageSnapshot,
  url: URL,
  doc: Document = document,
): KotRequestContext | null {
  const employeeId = parseEmployeeId(url, doc);

  if (employeeId === null) {
    return null;
  }

  const payload: KotRequestSyncPayload = {
    adminBaseUrl: `${url.origin}${url.pathname}`,
    employeeId,
    month: pageSnapshot.month,
    preserveQueryParams: createPreservedQueryParams(url),
    year: pageSnapshot.year,
  };

  return {
    key: `${employeeId}:${pageSnapshot.year}-${pageSnapshot.month
      .toString()
      .padStart(2, "0")}`,
    payload,
  };
}

export async function getKotRequestData(
  context: KotRequestContext,
): Promise<KotRequestCacheEntry | null> {
  const cached = await getCachedRequestEntry(
    context.payload.employeeId,
    context.payload.year,
    context.payload.month,
  );

  try {
    const response = await fetch(createRequestListUrl(context.payload), {
      credentials: "include",
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        `Request list fetch failed with status ${response.status}.`,
      );
    }

    const syncedAt = Date.now();
    const html = await response.text();
    const parsed = parseRequestListHtml(html, context.payload, syncedAt);

    return await setCachedRequestEntry(parsed);
  } catch {
    return cached;
  }
}
