import type {
  KotEditForm,
  KotFormEntry,
  KotPunchEdit,
  KotWorkingDateParts,
} from "@/domain/kot/correction/types";

// Per-record field-name builders. The suffix is the record id for existing
// punches or a small integer for added (spare) rows.
const fieldName = {
  date: (s: string): string => `recording_timestamp_date_${s}`,
  day: (s: string): string => `recording_timestamp_day_${s}`,
  hour: (s: string): string => `recording_timestamp_hour_${s}`,
  minute: (s: string): string => `recording_timestamp_minute_${s}`,
  month: (s: string): string => `recording_timestamp_month_${s}`,
  remark: (s: string): string => `request_remark_${s}`,
  remove: (s: string): string => `remove_timerecord_${s}`,
  sectionId: (s: string): string => `section_id_${s}`,
  time: (s: string): string => `recording_timestamp_time_${s}`,
  typeCode: (s: string): string => `recording_type_code_${s}`,
  year: (s: string): string => `recording_timestamp_year_${s}`,
} as const;

const ADD_COUNTER_FIELD = "recording_timestamp_add_counter";
const ACTION_ID_FIELD = "action_id";
const SUBMIT_ACTION_ID = "1";
const REMOVE_CHECKED_VALUE = "checked";

// Fields KOT's client-side JS fills in on the real working_edit page. The
// statically-fetched HTML leaves them as unrendered `$velocity` placeholders, so
// we set them explicitly — without this the server does not register a 打刻申請.
const ONE_DAY_SCHEDULE_FLAG_FIELD = "request_one_day_schedule_flag";
const ONE_DAY_SCHEDULE_FLAG_VALUE = "1";
const SELECTED_START_DATE_FIELD = "selected_start_date";
const SELECTED_END_DATE_FIELD = "selected_end_date";

function splitTime(time: string): { hour: string; minute: string } {
  const [hour = "", minute = ""] = time.trim().split(":");

  return {
    hour: hour.padStart(2, "0"),
    minute: minute.padStart(2, "0"),
  };
}

// Mutable override helper: replace the first entry with `name`, else append.
// Preserves repeated entries we never touch (e.g. the 3× CSRF token).
function setEntry(entries: KotFormEntry[], name: string, value: string): void {
  const index = entries.findIndex((entry) => entry.name === name);

  if (index === -1) {
    entries.push({ name, value });

    return;
  }

  entries[index] = { name, value };
}

function applyUpdate(
  entries: KotFormEntry[],
  edit: Extract<KotPunchEdit, { kind: "update" }>,
): void {
  if (edit.deleted) {
    setEntry(entries, fieldName.remove(edit.recordId), REMOVE_CHECKED_VALUE);
    setEntry(entries, fieldName.remark(edit.recordId), edit.message);

    return;
  }

  const { hour, minute } = splitTime(edit.time);

  setEntry(entries, fieldName.typeCode(edit.recordId), edit.typeCode);
  setEntry(entries, fieldName.time(edit.recordId), edit.time);
  setEntry(entries, fieldName.hour(edit.recordId), hour);
  setEntry(entries, fieldName.minute(edit.recordId), minute);
  setEntry(entries, fieldName.remark(edit.recordId), edit.message);
}

function applyAdd(
  entries: KotFormEntry[],
  edit: Extract<KotPunchEdit, { kind: "add" }>,
  suffix: string,
  workingDate: KotWorkingDateParts,
  defaultSectionId: string,
): void {
  const { hour, minute } = splitTime(edit.time);

  setEntry(entries, fieldName.typeCode(suffix), edit.typeCode);
  setEntry(entries, fieldName.time(suffix), edit.time);
  setEntry(entries, fieldName.hour(suffix), hour);
  setEntry(entries, fieldName.minute(suffix), minute);
  setEntry(entries, fieldName.year(suffix), workingDate.year);
  setEntry(entries, fieldName.month(suffix), workingDate.month);
  setEntry(entries, fieldName.day(suffix), workingDate.day);
  setEntry(entries, fieldName.date(suffix), workingDate.iso);
  setEntry(entries, fieldName.sectionId(suffix), defaultSectionId);
  setEntry(entries, fieldName.remark(suffix), edit.message);
}

// Allocate add-row suffixes: reuse pre-rendered spares first, then fall back to
// counter-based suffixes (mirroring recording_timestamp_add_counter).
function allocateAddSuffixes(form: KotEditForm, addCount: number): string[] {
  const suffixes: string[] = [];
  let counter = form.addCounter;

  for (let index = 0; index < addCount; index += 1) {
    const spare = form.spareSuffixes[index];

    if (spare !== undefined) {
      suffixes.push(spare);

      continue;
    }

    suffixes.push(String(counter));
    counter += 1;
  }

  return suffixes;
}

// Start from the serialized base form, apply per-row overrides, and append a
// single action_id=1. Returns the final entries to POST as FormData.
export function buildKotCorrectionPayload(
  form: KotEditForm,
  edits: readonly KotPunchEdit[],
): readonly KotFormEntry[] {
  const entries: KotFormEntry[] = form.baseEntries.map((entry) => ({
    ...entry,
  }));

  const adds = edits.filter(
    (edit): edit is Extract<KotPunchEdit, { kind: "add" }> =>
      edit.kind === "add",
  );
  const addSuffixes = allocateAddSuffixes(form, adds.length);

  let usedCounterSuffix = false;
  let addIndex = 0;

  for (const edit of edits) {
    if (edit.kind === "update") {
      applyUpdate(entries, edit);

      continue;
    }

    const suffix = addSuffixes[addIndex];

    addIndex += 1;

    if (suffix === undefined) {
      continue;
    }

    if (!form.spareSuffixes.includes(suffix)) {
      usedCounterSuffix = true;
    }

    applyAdd(entries, edit, suffix, form.workingDate, form.defaultSectionId);
  }

  if (usedCounterSuffix) {
    setEntry(entries, ADD_COUNTER_FIELD, String(form.addCounter + adds.length));
  }

  // Resolve the JS-derived fields to the values KOT's native 打刻申請 submits.
  setEntry(entries, ONE_DAY_SCHEDULE_FLAG_FIELD, ONE_DAY_SCHEDULE_FLAG_VALUE);
  setEntry(entries, SELECTED_START_DATE_FIELD, form.workingDate.compact);
  setEntry(entries, SELECTED_END_DATE_FIELD, form.workingDate.compact);
  setEntry(entries, ACTION_ID_FIELD, SUBMIT_ACTION_ID);

  return entries;
}
