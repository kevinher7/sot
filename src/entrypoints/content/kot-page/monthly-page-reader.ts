import { createIsoDateKey } from "@/domain/kot/date";
import type {
  KotDayRowSnapshot,
  KotMonthlyPageSnapshot,
} from "@/domain/kot/monthly-page-types";
import { MONTHLY_PAGE_ROW_SELECTOR } from "@/entrypoints/content/kot-page/contracts";
import { readMonthlyPageRowSnapshot } from "@/entrypoints/content/kot-page/monthly-page-row-reader";

function createSnapshotSignature(rows: readonly KotDayRowSnapshot[]): string {
  return rows
    .map((row) =>
      [
        row.isoDate,
        row.dayKind,
        row.hasError ? "error" : "ok",
        row.hasRequestMarker ? "req" : "clean",
        row.clockInMinutes ?? "-",
        row.clockOutMinutes ?? "-",
        row.breakStartMinutes.join(","),
        row.breakEndMinutes.join(","),
      ].join("|"),
    )
    .join(";");
}

export function readMonthlyPageSnapshot(
  now: Date,
  doc: Document = document,
): KotMonthlyPageSnapshot | null {
  const rows = Array.from(
    doc.querySelectorAll<HTMLTableRowElement>(MONTHLY_PAGE_ROW_SELECTOR),
  )
    .map((row) => readMonthlyPageRowSnapshot(row))
    .filter((row): row is KotDayRowSnapshot => row !== null)
    .sort((left, right) => left.isoDate.localeCompare(right.isoDate));

  if (rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];
  const todayDate = createIsoDateKey(now);

  return {
    month: Number.parseInt(firstRow.isoDate.slice(5, 7), 10),
    rows,
    signature: createSnapshotSignature(rows),
    todayRow: rows.find((row) => row.isoDate === todayDate) ?? null,
    year: Number.parseInt(firstRow.isoDate.slice(0, 4), 10),
  };
}
