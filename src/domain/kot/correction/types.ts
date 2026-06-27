// DOM-free domain model for the inline 打刻申請 (time-correction request) flow.

export type KotPunchTypeCode = "1" | "2" | "3" | "4";

// 打刻種別 codes as rendered by KOT's 勤務データ編集 form.
export const KOT_PUNCH_TYPE_LABELS: Record<KotPunchTypeCode, string> = {
  "1": "出勤",
  "2": "退勤",
  "3": "休憩開始",
  "4": "休憩終了",
};

export const KOT_PUNCH_TYPE_CODES: readonly KotPunchTypeCode[] = [
  "1",
  "2",
  "3",
  "4",
];

// A single serialized form control (name + resolved value).
export type KotFormEntry = {
  name: string;
  value: string;
};

// An existing punch row parsed from the edit page, keyed by its record id.
export type KotExistingPunch = {
  recordId: string;
  typeCode: string;
  time: string;
  sectionId: string;
};

// The DOM-free model produced from a fetched 勤務データ編集 page.
export type KotEditForm = {
  actionUrl: string;
  baseEntries: readonly KotFormEntry[];
  existingPunches: readonly KotExistingPunch[];
  spareSuffixes: readonly string[];
  addCounter: number;
  workingDate: KotWorkingDateParts;
  defaultSectionId: string;
};

export type KotWorkingDateParts = {
  // KOT's per-record date field format, e.g. "2026/06/19".
  iso: string;
  // Compact working_date format, e.g. "20260619".
  compact: string;
  year: string;
  month: string;
  day: string;
};

// A normalized edit derived from the form panel, applied over the base entries.
export type KotPunchEdit =
  | {
      kind: "update";
      recordId: string;
      typeCode: string;
      time: string;
      message: string;
      deleted: boolean;
    }
  | {
      kind: "add";
      typeCode: string;
      time: string;
      message: string;
    };
