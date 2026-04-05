import type { KotMonthlyPageSnapshot } from "@/domain/kot/monthly-page-types";
import type { KotRequestSyncPayload } from "@/domain/kot/request-data";

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
