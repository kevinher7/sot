import type { KotMonthlyPageSnapshot } from "@/domain/kot/monthly-page-types";
import type { KotRequestSyncPayload } from "@/domain/kot/request-data";
import {
  REQUEST_CONTEXT_EMPLOYEE_ID_SELECTORS,
  REQUEST_CONTEXT_EXCLUDED_PRESERVED_QUERY_KEYS,
} from "@/entrypoints/content/request-enrichment/contracts";

export type KotRequestContext = {
  key: string;
  payload: KotRequestSyncPayload;
};

function createPreservedQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    if (REQUEST_CONTEXT_EXCLUDED_PRESERVED_QUERY_KEYS.some((excludedKey) => excludedKey === key)) {
      return;
    }

    params[key] = value;
  });

  return params;
}

function parseEmployeeIdFromDocument(doc: Document, origin: string): string | null {
  for (const selector of REQUEST_CONTEXT_EMPLOYEE_ID_SELECTORS) {
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
      const url = new URL(link.href, origin);
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

  return parseEmployeeIdFromDocument(doc, url.origin);
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
