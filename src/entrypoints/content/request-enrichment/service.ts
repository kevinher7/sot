import type { KotRequestCacheEntry } from "@/domain/kot/request-data";
import { parseRequestListRows } from "@/domain/kot/request-parser";
import {
  getCachedRequestEntry,
  setCachedRequestEntry,
} from "@/platform/webext/storage";
import {
  REQUEST_LIST_PAGE_ID,
  REQUEST_LIST_REMOVED_QUERY_KEYS,
} from "@/entrypoints/content/request-enrichment/contracts";
import type { KotRequestContext } from "@/entrypoints/content/request-enrichment/context";
import { readRequestListRowsFromHtml } from "@/entrypoints/content/request-enrichment/request-list-reader";

function createRequestListUrl(payload: KotRequestContext["payload"]): string {
  const url = new URL(payload.adminBaseUrl);

  Object.entries(payload.preserveQueryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  url.searchParams.set("page_id", REQUEST_LIST_PAGE_ID);
  url.searchParams.set("employee_id", payload.employeeId);

  REQUEST_LIST_REMOVED_QUERY_KEYS.forEach((key) => {
    url.searchParams.delete(key);
  });

  return url.toString();
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
    const requestListUrl = createRequestListUrl(context.payload);
    const response = await fetch(requestListUrl, {
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
    const rows = readRequestListRowsFromHtml(html, requestListUrl);
    const parsed = parseRequestListRows(rows, context.payload, syncedAt);

    return await setCachedRequestEntry(parsed);
  } catch {
    return cached;
  }
}
