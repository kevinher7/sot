import { createIsoDateFromParts } from "@/domain/kot/date";
import type {
  KotDayKind,
  KotDayRowSnapshot,
} from "@/domain/kot/monthly-page-types";
import {
  parseClockTextMinuteList,
  parseClockTextMinutes,
} from "@/domain/kot/time-text";

const ACTION_CELL_WORKING_DATE_SELECTOR = 'input[name="working_date"]';
const ACTION_CELL_YEAR_SELECTOR = 'input[name="year"]';
const ACTION_CELL_MONTH_SELECTOR = 'input[name="month"]';
const ACTION_CELL_DAY_SELECTOR = 'input[name="day"]';
const DATE_CELL_SELECTOR =
  'td[data-ht-identity-cell="specific-sidemenu_date"][data-ht-sort-index="WORK_DAY"]';
const DATE_CELL_ERROR_ICON_SELECTOR = 'img[alt="エラー"]';
const REQUEST_MARKER_SELECTOR = ".specific-requested";
const WORK_DAY_TYPE_SELECTOR = 'td[data-ht-sort-index="WORK_DAY_TYPE"]';
const CLOCK_IN_SELECTOR = 'td[data-ht-sort-index="START_TIMERECORD"]';
const CLOCK_OUT_SELECTOR = 'td[data-ht-sort-index="END_TIMERECORD"]';
const BREAK_START_SELECTOR = 'td[data-ht-sort-index="REST_START_TIMERECORD"]';
const BREAK_END_SELECTOR = 'td[data-ht-sort-index="REST_END_TIMERECORD"]';
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
      isoDate: createIsoDateFromParts(year, month, day),
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
    isoDate: createIsoDateFromParts(year, month, day),
    month,
    year,
  };
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

function hasExplicitRowError(dateCell: HTMLTableCellElement): boolean {
  return (
    dateCell.title.includes("エラー") ||
    dateCell.querySelector(DATE_CELL_ERROR_ICON_SELECTOR) !== null
  );
}

function hasExplicitRowRequestMarker(row: HTMLTableRowElement): boolean {
  if (row.querySelector(REQUEST_MARKER_SELECTOR) !== null) {
    return true;
  }

  return row.textContent?.includes("[申]") ?? false;
}

export function readMonthlyPageRowSnapshot(
  row: HTMLTableRowElement,
): KotDayRowSnapshot | null {
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
  const clockInMinutes = parseClockTextMinutes(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(CLOCK_IN_SELECTOR),
    ),
  );
  const clockOutMinutes = parseClockTextMinutes(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(CLOCK_OUT_SELECTOR),
    ),
  );
  const breakStartMinutes = parseClockTextMinuteList(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(BREAK_START_SELECTOR),
    ),
  );
  const breakEndMinutes = parseClockTextMinuteList(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(BREAK_END_SELECTOR),
    ),
  );

  return {
    breakEndMinutes,
    breakStartMinutes,
    clockInMinutes,
    clockOutMinutes,
    day: identity.day,
    dayKind: toDayKind(dateCell, workDayTypeText),
    hasClockIn: clockInMinutes !== null,
    hasClockOut: clockOutMinutes !== null,
    hasError: hasExplicitRowError(dateCell),
    hasRequestMarker: hasExplicitRowRequestMarker(row),
    isoDate: identity.isoDate,
  };
}
