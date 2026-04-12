const KOT_ADMIN_HOST = "s2.ta.kingoftime.jp";
const MONTHLY_INDIVIDUAL_WORKING_LIST_PAGE_ID =
  "/working/monthly_individual_working_list";
const MONTHLY_PAGE_DATE_CELL_SELECTOR =
  'td[data-ht-identity-cell="specific-sidemenu_date"][data-ht-sort-index="WORK_DAY"]';
const MONTHLY_PAGE_WORKING_DATE_SELECTOR = 'input[name="working_date"]';

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
    (url.searchParams.get("page_id") === MONTHLY_INDIVIDUAL_WORKING_LIST_PAGE_ID
      || hasMonthlyIndividualWorkingListPageDom(doc))
  );
}
