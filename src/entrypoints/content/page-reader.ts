import type { KotDayKind } from "../../domain/kot/monthly-required-hours";

const DATE_CELL_SELECTOR =
  'td[data-ht-identity-cell="specific-sidemenu_date"][data-ht-sort-index="WORK_DAY"]';
const OFFDAY_CLASS_NAMES = [
  "htBlock-scrollTable_saturday",
  "htBlock-scrollTable_sunday",
] as const;

export type MonthlyWorkScheduleSnapshot = {
  dayKinds: KotDayKind[];
  signature: string;
};

function toDayKind(cell: HTMLTableCellElement): KotDayKind {
  return OFFDAY_CLASS_NAMES.some((className) =>
    cell.classList.contains(className),
  )
    ? "offday"
    : "workday";
}

export function readMonthlyWorkSchedule(
  doc: Document = document,
): MonthlyWorkScheduleSnapshot | null {
  const cells = Array.from(
    doc.querySelectorAll<HTMLTableCellElement>(DATE_CELL_SELECTOR),
  );

  if (cells.length === 0) {
    return null;
  }

  const dayKinds = cells.map(toDayKind);

  return {
    dayKinds,
    signature: dayKinds.join(","),
  };
}
