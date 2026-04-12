export const REQUEST_CONTEXT_EMPLOYEE_ID_SELECTORS = [
  'input[name="employee_id"]',
  'input[name*="employee_id"]',
  'select[name="employee_id"]',
  'select[name*="employee_id"]',
] as const;

export const REQUEST_LIST_DATE_INPUT_CANDIDATES = [
  'input[name="working_date"]',
  'input[name="target_date"]',
  'input[name="date"]',
  'input[name*="working_date"]',
  'input[name*="target_date"]',
] as const;
export const REQUEST_LIST_EMPLOYEE_INPUT_CANDIDATES = [
  'input[name="employee_id"]',
  'input[name*="employee_id"]',
] as const;
export const REQUEST_LIST_REQUEST_ID_INPUT_SELECTOR =
  'input[name="request_id"]';
export const REQUEST_LIST_ORIGINAL_CONTENT_SELECTOR =
  'td[data-ht-sort-index="EMPLOYEE_REQUEST_LIST_ORIGINAL_CONTENT"]';
export const REQUEST_LIST_REQUESTED_CONTENT_SELECTOR =
  'td[data-ht-sort-index="EMPLOYEE_REQUEST_LIST_REQUESTED_CONTENT"]';
export const REQUEST_LIST_TARGET_DATE_SELECTOR =
  'td[data-ht-sort-index="EMPLOYEE_REQUEST_LIST_TARGET_DATE"]';
export const REQUEST_LIST_STATUS_SELECTORS = [
  'td[data-ht-sort-index="EMPLOYEE_REQUEST_LIST_STATUS"]',
  'td[data-ht-sort-index="EMPLOYEE_REQUEST_LIST_APPROVE_STATUS"]',
] as const;

export const REQUEST_LIST_PAGE_ID = "/employee/request_list";
export const REQUEST_LIST_REMOVED_QUERY_KEYS = [
  "call_from",
  "date_selection_type",
] as const;
export const REQUEST_CONTEXT_EXCLUDED_PRESERVED_QUERY_KEYS = [
  "page_id",
  "employee_id",
] as const;
