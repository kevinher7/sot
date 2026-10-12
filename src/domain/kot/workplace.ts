import type { KotDayRowSnapshot } from "@/domain/kot/monthly-page-types";

export type Workplace = "office" | "remote";

export type WorkplaceChoices = Readonly<Record<string, Workplace>>;

export function resolveWorkplace(
  choices: WorkplaceChoices,
  isoDate: string,
): Workplace {
  return choices[isoDate] ?? "remote";
}

export function countOfficeDays(
  rows: readonly KotDayRowSnapshot[],
  choices: WorkplaceChoices,
): number {
  return rows.filter(
    (row) =>
      row.hasClockIn && resolveWorkplace(choices, row.isoDate) === "office",
  ).length;
}
