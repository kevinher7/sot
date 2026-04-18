import type { KotMonthlyPageSnapshot } from "@/domain/kot/monthly-page-types";
import type { KotRequestSyncPayload } from "@/domain/kot/request-data";
import {
  REQUEST_CONTEXT_EXCLUDED_PRESERVED_QUERY_KEYS,
  REQUEST_CONTEXT_REQUEST_LIST_LINK_SELECTOR,
  REQUEST_LIST_PAGE_ID,
} from "@/entrypoints/content/request-enrichment/contracts";

export type KotRequestContext = {
  key: string;
  payload: KotRequestSyncPayload;
};

function createPreservedQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    if (
      REQUEST_CONTEXT_EXCLUDED_PRESERVED_QUERY_KEYS.some(
        (excludedKey) => excludedKey === key,
      )
    ) {
      return;
    }

    params[key] = value;
  });

  return params;
}

function createPreservedQueryParamSignature(
  params: Record<string, string>,
): string {
  return Object.entries(params)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function readRequestListUrl(doc: Document, currentUrl: URL): URL | null {
  const link = doc.querySelector<HTMLAnchorElement>(
    REQUEST_CONTEXT_REQUEST_LIST_LINK_SELECTOR,
  );

  if (link === null) {
    return null;
  }

  try {
    const requestListUrl = new URL(link.href, currentUrl);

    if (
      requestListUrl.origin !== currentUrl.origin ||
      requestListUrl.pathname !== currentUrl.pathname ||
      requestListUrl.searchParams.get("page_id") !== REQUEST_LIST_PAGE_ID
    ) {
      return null;
    }

    return requestListUrl;
  } catch {
    return null;
  }
}

export function createKotRequestContext(
  pageSnapshot: KotMonthlyPageSnapshot,
  url: URL,
  doc: Document = document,
): KotRequestContext | null {
  const requestListUrl = readRequestListUrl(doc, url);

  if (requestListUrl === null) {
    return null;
  }

  const employeeId =
    requestListUrl.searchParams.get("employee_id")?.trim() ?? "";

  if (employeeId === "") {
    return null;
  }

  const preserveQueryParams = createPreservedQueryParams(requestListUrl);
  const payload: KotRequestSyncPayload = {
    adminBaseUrl: `${url.origin}${url.pathname}`,
    employeeId,
    month: pageSnapshot.month,
    preserveQueryParams,
    year: pageSnapshot.year,
  };

  return {
    key: `${employeeId}:${pageSnapshot.year}-${pageSnapshot.month
      .toString()
      .padStart(2, "0")}:${createPreservedQueryParamSignature(
      preserveQueryParams,
    )}`,
    payload,
  };
}
