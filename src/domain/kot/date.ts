export function createIsoDateFromParts(
  year: number,
  month: number,
  day: number,
): string {
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function createIsoDateKey(date: Date): string {
  return createIsoDateFromParts(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

export function parseKotIsoDate(value: string): string | null {
  const normalized = value.trim();

  if (/^\d{8}$/u.test(normalized)) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
  }

  const match = normalized.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/u);

  if (!match) {
    return null;
  }

  return createIsoDateFromParts(
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10),
    Number.parseInt(match[3], 10),
  );
}
