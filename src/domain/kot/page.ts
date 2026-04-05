import { DEFAULT_SETTINGS } from "./settings";

export function isKotAdminHost(url: URL): boolean {
  return (
    url.hostname === DEFAULT_SETTINGS.targetHost &&
    url.pathname.startsWith("/admin/")
  );
}

export function isMonthlyIndividualWorkingListPage(url: URL): boolean {
  return (
    isKotAdminHost(url) &&
    url.searchParams.get("page_id") === DEFAULT_SETTINGS.targetPageId
  );
}
