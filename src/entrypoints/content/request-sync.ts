import type { KotRequestCacheEntry } from "@/domain/kot/request-data";
import { parseRequestListRows } from "@/domain/kot/request-parser";
import {
  getCachedRequestEntry,
  setCachedRequestEntry,
} from "@/platform/webext/storage";
import type { KotRequestContext } from "@/entrypoints/content/request-context";
import { readRequestListRowsFromHtml } from "@/entrypoints/content/request-list-reader";

function createRequestListUrl(payload: KotRequestContext["payload"]): string {
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
    const rows = readRequestListRowsFromHtml(html);
    const parsed = parseRequestListRows(rows, context.payload, syncedAt);

    return await setCachedRequestEntry(parsed);
  } catch {
    return cached;
  }
}
