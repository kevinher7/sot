import type { KotPunchEdit } from "@/domain/kot/correction/types";

// A row as edited in the form panel. `original` is null for newly-added rows.
export type KotDraftPunchRow = {
  recordId: string | undefined;
  typeCode: string;
  time: string;
  message: string;
  deleted: boolean;
  original: { typeCode: string; time: string } | undefined;
};

function isAddedRow(row: KotDraftPunchRow): boolean {
  return row.recordId === undefined;
}

function hasAnyInput(row: KotDraftPunchRow): boolean {
  return row.typeCode.trim() !== "" || row.time.trim() !== "";
}

// "Changed row" per the locked spec: newly added (with input), time-edited,
// type-changed, or 削除-checked.
export function isKotDraftRowChanged(row: KotDraftPunchRow): boolean {
  if (isAddedRow(row)) {
    return hasAnyInput(row);
  }

  if (row.deleted) {
    return true;
  }

  if (row.original === undefined) {
    return false;
  }

  return (
    row.typeCode !== row.original.typeCode || row.time !== row.original.time
  );
}

// Reduce the draft rows to the minimal set of overrides the payload builder
// applies; unchanged existing rows are omitted (sent verbatim from base form).
export function deriveKotPunchEdits(
  rows: readonly KotDraftPunchRow[],
): readonly KotPunchEdit[] {
  const edits: KotPunchEdit[] = [];

  for (const row of rows) {
    if (!isKotDraftRowChanged(row)) {
      continue;
    }

    if (row.recordId === undefined) {
      edits.push({
        kind: "add",
        message: row.message,
        time: row.time,
        typeCode: row.typeCode,
      });

      continue;
    }

    edits.push({
      deleted: row.deleted,
      kind: "update",
      message: row.message,
      recordId: row.recordId,
      time: row.time,
      typeCode: row.typeCode,
    });
  }

  return edits;
}
