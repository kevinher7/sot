import type {
  KotDayKind,
  KotDayRowSnapshot,
  KotMonthlyPageSnapshot,
} from "../../domain/kot/overlay-calculations";

const ROW_SELECTOR = "tr";
const ACTION_CELL_WORKING_DATE_SELECTOR = 'input[name="working_date"]';
const ACTION_CELL_YEAR_SELECTOR = 'input[name="year"]';
const ACTION_CELL_MONTH_SELECTOR = 'input[name="month"]';
const ACTION_CELL_DAY_SELECTOR = 'input[name="day"]';
const DATE_CELL_SELECTOR =
  'td[data-ht-identity-cell="specific-sidemenu_date"][data-ht-sort-index="WORK_DAY"]';
const WORK_DAY_TYPE_SELECTOR = 'td[data-ht-sort-index="WORK_DAY_TYPE"]';
const CLOCK_IN_SELECTOR = 'td[data-ht-sort-index="START_TIMERECORD"]';
const CLOCK_OUT_SELECTOR = 'td[data-ht-sort-index="END_TIMERECORD"]';
const BREAK_MINUTES_SELECTOR = 'td[data-ht-sort-index="REST_MINUTE"]';
const WORKED_MINUTES_SELECTOR = 'td[data-ht-sort-index="ALL_WORK_MINUTE"]';
const OFFDAY_CLASS_NAMES = [
  "htBlock-scrollTable_saturday",
  "htBlock-scrollTable_sunday",
] as const;
const OFFDAY_WORK_DAY_TYPE_PATTERNS = [/休日/u, /休暇/u, /休み/u] as const;

function normalizeCellText(element: Element | null): string {
  return element?.textContent?.replace(/\s+/gu, " ").trim() ?? "";
}

function parseNumber(value: string): number | null {
  if (!/^\d+$/u.test(value)) {
    return null;
  }

  return Number.parseInt(value, 10);
}

function parseWorkingDateFromActionCell(row: HTMLTableRowElement): {
  day: number;
  isoDate: string;
  month: number;
  year: number;
} | null {
  const workingDateValue = (
    row.querySelector<HTMLInputElement>(ACTION_CELL_WORKING_DATE_SELECTOR)
      ?.value ?? ""
  ).trim();

  if (/^\d{8}$/u.test(workingDateValue)) {
    const year = Number.parseInt(workingDateValue.slice(0, 4), 10);
    const month = Number.parseInt(workingDateValue.slice(4, 6), 10);
    const day = Number.parseInt(workingDateValue.slice(6, 8), 10);

    return {
      day,
      isoDate: `${workingDateValue.slice(0, 4)}-${workingDateValue.slice(4, 6)}-${workingDateValue.slice(6, 8)}`,
      month,
      year,
    };
  }

  const year = parseNumber(
    row.querySelector<HTMLInputElement>(ACTION_CELL_YEAR_SELECTOR)?.value ?? "",
  );
  const month = parseNumber(
    row.querySelector<HTMLInputElement>(ACTION_CELL_MONTH_SELECTOR)?.value ??
      "",
  );
  const day = parseNumber(
    row.querySelector<HTMLInputElement>(ACTION_CELL_DAY_SELECTOR)?.value ?? "",
  );

  if (year === null || month === null || day === null) {
    return null;
  }

  return {
    day,
    isoDate: `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
    month,
    year,
  };
}

function parseClockMinutes(text: string): number | null {
  const match = text.match(/(\d{1,2}):(\d{2})/u);

  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  return hours * 60 + minutes;
}

function parseDurationMinutes(text: string): number | null {
  const timeMatch = text.match(/(-?\d+):(\d{2})/u);

  if (timeMatch) {
    const hours = Number.parseInt(timeMatch[1], 10);
    const minutes = Number.parseInt(timeMatch[2], 10);
    const sign = hours < 0 ? -1 : 1;

    return hours * 60 + sign * minutes;
  }

  const minuteMatch = text.match(/(-?\d+)\s*分/u);

  if (minuteMatch) {
    return Number.parseInt(minuteMatch[1], 10);
  }

  if (/^-?\d+$/u.test(text)) {
    return Number.parseInt(text, 10);
  }

  return null;
}

function toDayKind(
  dateCell: HTMLTableCellElement,
  workDayTypeText: string,
): KotDayKind {
  if (
    OFFDAY_CLASS_NAMES.some((className) =>
      dateCell.classList.contains(className),
    ) ||
    OFFDAY_WORK_DAY_TYPE_PATTERNS.some((pattern) =>
      pattern.test(workDayTypeText),
    )
  ) {
    return "offday";
  }

  return "workday";
}

function readRowSnapshot(row: HTMLTableRowElement): KotDayRowSnapshot | null {
  const dateCell = row.querySelector<HTMLTableCellElement>(DATE_CELL_SELECTOR);

  if (!dateCell) {
    return null;
  }

  const identity = parseWorkingDateFromActionCell(row);

  if (!identity) {
    return null;
  }

  const workDayTypeText = normalizeCellText(
    row.querySelector<HTMLTableCellElement>(WORK_DAY_TYPE_SELECTOR),
  );
  const clockInMinutes = parseClockMinutes(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(CLOCK_IN_SELECTOR),
    ),
  );
  const clockOutMinutes = parseClockMinutes(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(CLOCK_OUT_SELECTOR),
    ),
  );
  const breakMinutes = parseDurationMinutes(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(BREAK_MINUTES_SELECTOR),
    ),
  );
  const workedMinutes = parseDurationMinutes(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(WORKED_MINUTES_SELECTOR),
    ),
  );

  return {
    breakMinutes,
    clockInMinutes,
    clockOutMinutes,
    day: identity.day,
    dayKind: toDayKind(dateCell, workDayTypeText),
    hasClockIn: clockInMinutes !== null,
    hasClockOut: clockOutMinutes !== null,
    isoDate: identity.isoDate,
    workedMinutes,
  };
}

function createSnapshotSignature(rows: readonly KotDayRowSnapshot[]): string {
  return rows
    .map((row) =>
      [
        row.isoDate,
        row.dayKind,
        row.clockInMinutes ?? "-",
        row.clockOutMinutes ?? "-",
        row.breakMinutes ?? "-",
        row.workedMinutes ?? "-",
      ].join("|"),
    )
    .join(";");
}

function createDateKey(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function readMonthlyPageSnapshot(
  now: Date,
  doc: Document = document,
): KotMonthlyPageSnapshot | null {
  const rows = Array.from(
    doc.querySelectorAll<HTMLTableRowElement>(ROW_SELECTOR),
  )
    .map(readRowSnapshot)
    .filter((row): row is KotDayRowSnapshot => row !== null)
    .sort((left, right) => left.isoDate.localeCompare(right.isoDate));

  if (rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];
  const todayDate = createDateKey(now);
  const actualWorkedMinutesSoFar = rows.reduce((total, row) => {
    if (row.isoDate > todayDate || row.workedMinutes === null) {
      return total;
    }

    return total + row.workedMinutes;
  }, 0);

  return {
    actualWorkedMinutesSoFar,
    month: Number.parseInt(firstRow.isoDate.slice(5, 7), 10),
    rows,
    signature: createSnapshotSignature(rows),
    todayRow: rows.find((row) => row.isoDate === todayDate) ?? null,
    year: Number.parseInt(firstRow.isoDate.slice(0, 4), 10),
  };
}
