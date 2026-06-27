// page_id for the per-day 勤務データ編集 (working_edit) page.
export const WORKING_EDIT_PAGE_ID = "/working/working_edit";

// The correction form rendered on the working_edit page.
export const WORKING_EDIT_FORM_SELECTOR = "form#working_edit_form";

// Comma-separated existing record ids (suffix for every existing punch field).
export const EXIST_TIMERECORD_IDS_SELECTOR =
  'input[name="exist_timerecord_ids"]';

// Tracks the next spare-row index for added punches.
export const ADD_COUNTER_SELECTOR =
  'input[name="recording_timestamp_add_counter"]';

// Top-level 打刻所属 default for the day.
export const FORM_SECTION_ID_NAME = "section_id";

export const RECORDING_TYPE_CODE_PREFIX = "recording_type_code_";

// The working_edit form embeds schedule / leave / break-pattern / image-upload
// sections that a pure 打刻申請 must NOT submit. KOT's native submit prunes them
// (and several carry unrendered `$velocity` / `{{count}}` template values). We
// drop them so our serialized payload matches the real 打刻申請 field set.
const EXCLUDED_FORM_FIELD_NAMES = new Set<string>([
  "uploading_file",
  "compressed_image_string",
  "display_name",
  "regarding_work_type_code",
  "schedule_pattern_id",
  "old_schedule_pattern_id",
  "schedule_break_minute",
  "work_day_type_code",
  "time_division_id",
  "time_unit_holiday_counter",
  "show_half_day_time_unit_fields",
  "scheduled_section_id",
  "invalid_auto_break_flag",
  "image_upload_form",
  "remark",
]);

const EXCLUDED_FORM_FIELD_PREFIXES: readonly string[] = [
  "schedule_start_time",
  "schedule_end_time",
  "early_work_",
  "late_work_",
  "break_start_time",
  "break_end_time",
  "break_pattern_counter",
  "org_break_",
  "leave_type_",
];

export function isExcludedCorrectionFormField(name: string): boolean {
  if (EXCLUDED_FORM_FIELD_NAMES.has(name)) {
    return true;
  }

  return EXCLUDED_FORM_FIELD_PREFIXES.some((prefix) => name.startsWith(prefix));
}
