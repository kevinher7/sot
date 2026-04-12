import {
  KOT_ADMIN_HOST,
  MONTHLY_INDIVIDUAL_WORKING_LIST_PAGE_ID,
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_WORKING_DATE_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";

function isKotAdminUrl(url: URL): boolean {
  return url.hostname === KOT_ADMIN_HOST && url.pathname.startsWith("/admin/");
}

function hasMonthlyIndividualWorkingListPageDom(
  doc: Document = document,
): boolean {
  return (
    doc.querySelector(MONTHLY_PAGE_DATE_CELL_SELECTOR) !== null &&
    doc.querySelector<HTMLInputElement>(MONTHLY_PAGE_WORKING_DATE_SELECTOR) !==
      null
  );
}

export function isMonthlyIndividualWorkingListPage(
  url: URL,
  doc: Document = document,
): boolean {
  return (
    isKotAdminUrl(url) &&
    (url.searchParams.get("page_id") === MONTHLY_INDIVIDUAL_WORKING_LIST_PAGE_ID ||
      hasMonthlyIndividualWorkingListPageDom(doc))
  );
}
