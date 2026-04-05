export const KOT_ADMIN_HOST = "s2.ta.kingoftime.jp";
export const MONTHLY_INDIVIDUAL_WORKING_LIST_PAGE_ID =
  "/working/monthly_individual_working_list";

export function isKotAdminHost(url: URL): boolean {
  return url.hostname === KOT_ADMIN_HOST && url.pathname.startsWith("/admin/");
}

export function isMonthlyIndividualWorkingListPage(url: URL): boolean {
  return (
    isKotAdminHost(url) &&
    url.searchParams.get("page_id") === MONTHLY_INDIVIDUAL_WORKING_LIST_PAGE_ID
  );
}
