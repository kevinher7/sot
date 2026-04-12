export const KOT_ADMIN_HOST = "s2.ta.kingoftime.jp";
export const MONTHLY_INDIVIDUAL_WORKING_LIST_PAGE_ID =
  "/working/monthly_individual_working_list";

export const MONTHLY_PAGE_ROW_SELECTOR = "tr";
export const MONTHLY_PAGE_DATE_CELL_SELECTOR =
  'td[data-ht-identity-cell="specific-sidemenu_date"][data-ht-sort-index="WORK_DAY"]';
export const MONTHLY_PAGE_WORKING_DATE_SELECTOR = 'input[name="working_date"]';
export const MONTHLY_PAGE_DATE_CELL_ERROR_ICON_SELECTOR = 'img[alt="エラー"]';
export const MONTHLY_PAGE_REQUEST_MARKER_SELECTOR = ".specific-requested";
export const MONTHLY_PAGE_WORK_DAY_TYPE_SELECTOR =
  'td[data-ht-sort-index="WORK_DAY_TYPE"]';
export const MONTHLY_PAGE_CLOCK_IN_SELECTOR =
  'td[data-ht-sort-index="START_TIMERECORD"]';
export const MONTHLY_PAGE_CLOCK_OUT_SELECTOR =
  'td[data-ht-sort-index="END_TIMERECORD"]';
export const MONTHLY_PAGE_BREAK_START_SELECTOR =
  'td[data-ht-sort-index="REST_START_TIMERECORD"]';
export const MONTHLY_PAGE_BREAK_END_SELECTOR =
  'td[data-ht-sort-index="REST_END_TIMERECORD"]';

export const MONTHLY_PAGE_ACTION_CELL_WORKING_DATE_SELECTOR =
  'input[name="working_date"]';
export const MONTHLY_PAGE_ACTION_CELL_YEAR_SELECTOR = 'input[name="year"]';
export const MONTHLY_PAGE_ACTION_CELL_MONTH_SELECTOR = 'input[name="month"]';
export const MONTHLY_PAGE_ACTION_CELL_DAY_SELECTOR = 'input[name="day"]';

export const MONTHLY_PAGE_OFFDAY_CLASS_NAMES = [
  "htBlock-scrollTable_saturday",
  "htBlock-scrollTable_sunday",
] as const;
export const MONTHLY_PAGE_OFFDAY_WORK_DAY_TYPE_PATTERNS = [
  /休日/u,
  /休暇/u,
  /休み/u,
] as const;

export const OVERLAY_POSITION_ANCHOR_SELECTOR = "h1.htBlock-pageTitleSticky";
