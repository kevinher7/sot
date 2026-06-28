import type {
  KotEditForm,
  KotExistingPunch,
  KotFormEntry,
  KotWorkingDateParts,
} from "@/domain/kot/correction/types";
import {
  ADD_COUNTER_SELECTOR,
  EXIST_TIMERECORD_IDS_SELECTOR,
  FORM_SECTION_ID_NAME,
  isExcludedCorrectionFormField,
  RECORDING_TYPE_CODE_PREFIX,
  WORKING_EDIT_FORM_SELECTOR,
} from "@/entrypoints/content/correction-request/contracts";

const SKIPPED_INPUT_TYPES = new Set(["submit", "button", "image", "reset"]);

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function listFormControls(form: HTMLFormElement): readonly FormControl[] {
  return [...form.querySelectorAll<FormControl>("input, select, textarea")];
}

// Resolve a control's submit value. Unchecked checkboxes/radios contribute
// nothing; selects fall back to the selected option's trimmed text when it has
// no value attribute (HTMLSelectElement.value already does this).
function resolveControlValue(control: FormControl): string | undefined {
  if (control instanceof HTMLInputElement) {
    if (SKIPPED_INPUT_TYPES.has(control.type)) {
      return undefined;
    }

    if (control.type === "checkbox" || control.type === "radio") {
      return control.checked ? control.value : undefined;
    }

    return control.value;
  }

  return control.value;
}

function serializeForm(form: HTMLFormElement): readonly KotFormEntry[] {
  const entries: KotFormEntry[] = [];

  for (const control of listFormControls(form)) {
    // Disabled controls are never submitted by the browser; mirror that. Drop
    // the schedule / leave / break / upload sections that a 打刻申請 omits.
    if (
      control.name === "" ||
      control.disabled ||
      isExcludedCorrectionFormField(control.name)
    ) {
      continue;
    }

    const value = resolveControlValue(control);

    if (value === undefined) {
      continue;
    }

    entries.push({ name: control.name, value });
  }

  return entries;
}

function readExistingIds(form: HTMLFormElement): readonly string[] {
  const raw =
    form
      .querySelector<HTMLInputElement>(EXIST_TIMERECORD_IDS_SELECTOR)
      ?.value.trim() ?? "";

  if (raw === "") {
    return [];
  }

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");
}

function readControlValue(form: HTMLFormElement, name: string): string {
  const control = form.querySelector<FormControl>(`[name="${name}"]`);

  return control === null ? "" : (resolveControlValue(control) ?? "");
}

function readExistingPunches(
  form: HTMLFormElement,
  existingIds: readonly string[],
): readonly KotExistingPunch[] {
  return existingIds.map((recordId) => ({
    recordId,
    sectionId: readControlValue(form, `section_id_${recordId}`),
    time: readControlValue(form, `recording_timestamp_time_${recordId}`),
    typeCode: readControlValue(form, `recording_type_code_${recordId}`),
  }));
}

// Spare add-rows are type-code controls whose suffix is neither an existing
// record id nor the {{count}} template placeholder.
function readSpareSuffixes(
  form: HTMLFormElement,
  existingIds: readonly string[],
): readonly string[] {
  const existingSet = new Set(existingIds);
  const suffixes: string[] = [];

  for (const control of form.querySelectorAll<FormControl>(
    `[name^="${RECORDING_TYPE_CODE_PREFIX}"]`,
  )) {
    const suffix = control.name.slice(RECORDING_TYPE_CODE_PREFIX.length);

    if (suffix === "" || suffix.includes("{{") || existingSet.has(suffix)) {
      continue;
    }

    suffixes.push(suffix);
  }

  return suffixes;
}

function readWorkingDate(form: HTMLFormElement): KotWorkingDateParts {
  const raw = readControlValue(form, "working_date").trim();
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);

  return {
    compact: raw,
    day,
    // KOT's per-record date field uses the slash format.
    iso: `${year}/${month}/${day}`,
    month,
    year,
  };
}

function readAddCounter(form: HTMLFormElement, spareCount: number): number {
  const raw = form
    .querySelector<HTMLInputElement>(ADD_COUNTER_SELECTOR)
    ?.value.trim();
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);

  return Number.isNaN(parsed) ? spareCount : parsed;
}

export function readKotEditFormFromHtml(
  html: string,
  pageUrl: string,
): KotEditForm | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const form = doc.querySelector<HTMLFormElement>(WORKING_EDIT_FORM_SELECTOR);

  if (form === null) {
    return null;
  }

  // The hidden {{count}} template row is serialized and POSTed verbatim, exactly
  // as the browser does (the server ignores it). readSpareSuffixes filters its
  // {{count}} placeholder out, so it is never treated as a real spare row.
  const actionAttr = form.getAttribute("action") ?? "";

  let actionUrl: string;

  try {
    actionUrl = new URL(actionAttr, pageUrl).toString();
  } catch {
    return null;
  }

  const existingIds = readExistingIds(form);
  const spareSuffixes = readSpareSuffixes(form, existingIds);

  return {
    actionUrl,
    addCounter: readAddCounter(form, spareSuffixes.length),
    baseEntries: serializeForm(form),
    defaultSectionId: readControlValue(form, FORM_SECTION_ID_NAME),
    existingPunches: readExistingPunches(form, existingIds),
    spareSuffixes,
    workingDate: readWorkingDate(form),
  };
}
