import { createIsoDateFromParts } from "@/domain/kot/date";
import type {
  KotDayKind,
  KotDayRowSnapshot,
} from "@/domain/kot/monthly-page-types";
import {
  parseClockTextMinuteList,
  parseClockTextMinutes,
} from "@/domain/kot/time-text";
import {
  MONTHLY_PAGE_ACTION_CELL_DAY_SELECTOR,
  MONTHLY_PAGE_ACTION_CELL_MONTH_SELECTOR,
  MONTHLY_PAGE_ACTION_CELL_WORKING_DATE_SELECTOR,
  MONTHLY_PAGE_ACTION_CELL_YEAR_SELECTOR,
  MONTHLY_PAGE_BREAK_END_SELECTOR,
  MONTHLY_PAGE_BREAK_START_SELECTOR,
  MONTHLY_PAGE_CLOCK_IN_SELECTOR,
  MONTHLY_PAGE_CLOCK_OUT_SELECTOR,
  MONTHLY_PAGE_DATE_CELL_ERROR_ICON_SELECTOR,
  MONTHLY_PAGE_DATE_CELL_SELECTOR,
  MONTHLY_PAGE_OFFDAY_CLASS_NAMES,
  MONTHLY_PAGE_OFFDAY_WORK_DAY_TYPE_PATTERNS,
  MONTHLY_PAGE_REQUEST_MARKER_SELECTOR,
  MONTHLY_PAGE_WORK_DAY_TYPE_SELECTOR,
} from "@/entrypoints/content/kot-page/contracts";

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
    row.querySelector<HTMLInputElement>(MONTHLY_PAGE_ACTION_CELL_WORKING_DATE_SELECTOR)
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
    row.querySelector<HTMLInputElement>(MONTHLY_PAGE_ACTION_CELL_YEAR_SELECTOR)
      ?.value ?? "",
  );
  const month = parseNumber(
    row.querySelector<HTMLInputElement>(MONTHLY_PAGE_ACTION_CELL_MONTH_SELECTOR)
      ?.value ?? "",
  );
  const day = parseNumber(
    row.querySelector<HTMLInputElement>(MONTHLY_PAGE_ACTION_CELL_DAY_SELECTOR)
      ?.value ?? "",
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
    MONTHLY_PAGE_OFFDAY_CLASS_NAMES.some((className) =>
      dateCell.classList.contains(className),
    ) ||
    MONTHLY_PAGE_OFFDAY_WORK_DAY_TYPE_PATTERNS.some((pattern) =>
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
    dateCell.querySelector(MONTHLY_PAGE_DATE_CELL_ERROR_ICON_SELECTOR) !== null
  );
}

function hasExplicitRowRequestMarker(row: HTMLTableRowElement): boolean {
  if (row.querySelector(MONTHLY_PAGE_REQUEST_MARKER_SELECTOR) !== null) {
    return true;
  }

  return row.textContent?.includes("[申]") ?? false;
}

export function readMonthlyPageRowSnapshot(
  row: HTMLTableRowElement,
): KotDayRowSnapshot | null {
  const dateCell = row.querySelector<HTMLTableCellElement>(
    MONTHLY_PAGE_DATE_CELL_SELECTOR,
  );

  if (!dateCell) {
    return null;
  }

  const identity = parseWorkingDateFromActionCell(row);

  if (!identity) {
    return null;
  }

  const workDayTypeText = normalizeCellText(
    row.querySelector<HTMLTableCellElement>(MONTHLY_PAGE_WORK_DAY_TYPE_SELECTOR),
  );
  const clockInMinutes = parseClockTextMinutes(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(MONTHLY_PAGE_CLOCK_IN_SELECTOR),
    ),
  );
  const clockOutMinutes = parseClockTextMinutes(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(MONTHLY_PAGE_CLOCK_OUT_SELECTOR),
    ),
  );
  const breakStartMinutes = parseClockTextMinuteList(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(MONTHLY_PAGE_BREAK_START_SELECTOR),
    ),
  );
  const breakEndMinutes = parseClockTextMinuteList(
    normalizeCellText(
      row.querySelector<HTMLTableCellElement>(MONTHLY_PAGE_BREAK_END_SELECTOR),
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
