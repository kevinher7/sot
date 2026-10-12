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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeWorkplaceChoices(value: unknown): WorkplaceChoices {
  if (!isRecord(value)) {
    return {};
  }

  const choices: Record<string, Workplace> = {};

  for (const [isoDate, workplace] of Object.entries(value)) {
    if (workplace === "office" || workplace === "remote") {
      choices[isoDate] = workplace;
    }
  }

  return choices;
}
