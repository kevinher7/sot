import {
  isKotDraftRowChanged,
  type KotDraftPunchRow,
} from "@/domain/kot/correction/draft";

export type KotCorrectionValidationError = {
  rowIndex: number;
  field: "type" | "time" | "message";
  message: string;
};

export type KotCorrectionValidationResult = {
  errors: readonly KotCorrectionValidationError[];
  isValid: boolean;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/u;

export function isValidKotPunchTime(value: string): boolean {
  return TIME_PATTERN.test(value.trim());
}

// Hard, local-only pre-validation. KOT's server validation is too lenient, so
// we block obviously-broken submits before POSTing. A row only needs a type,
// time, and message when it was actually changed.
export function validateKotCorrectionDraft(
  rows: readonly KotDraftPunchRow[],
): KotCorrectionValidationResult {
  const errors: KotCorrectionValidationError[] = [];

  rows.forEach((row, rowIndex) => {
    if (!isKotDraftRowChanged(row)) {
      return;
    }

    // A deleted existing row carries no new values to validate.
    if (row.recordId !== undefined && row.deleted) {
      if (row.message.trim() === "") {
        errors.push({
          field: "message",
          message: "削除する打刻には申請メッセージが必要です。",
          rowIndex,
        });
      }

      return;
    }

    if (row.typeCode.trim() === "") {
      errors.push({
        field: "type",
        message: "打刻種別を選択してください。",
        rowIndex,
      });
    }

    if (!isValidKotPunchTime(row.time)) {
      errors.push({
        field: "time",
        message: "時刻を HH:MM 形式で入力してください。",
        rowIndex,
      });
    }

    if (row.message.trim() === "") {
      errors.push({
        field: "message",
        message: "変更した打刻には申請メッセージが必要です。",
        rowIndex,
      });
    }
  });

  return {
    errors,
    isValid: errors.length === 0,
  };
}
