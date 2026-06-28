export function parseClockTextMinutes(value: string): number | null {
  const match = value.match(/(\d{1,2}):(\d{2})/u);

  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  return hours * 60 + minutes;
}

// 73 -> "01:13". Wraps minutes past 24h via modulo so values stay HH:MM.
export function formatMinutesAsClock(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;

  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// 534 -> "8.54". Matches the host monthly table's hours-dot-minutes display
// (the fractional part is literal minutes, not a decimal fraction of an hour).
export function formatMinutesAsHoursDot(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;

  return `${hours}.${mins.toString().padStart(2, "0")}`;
}

export function parseClockTextMinuteList(value: string): number[] {
  return Array.from(value.matchAll(/(\d{1,2}):(\d{2})/gu), (match) => {
    const hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);

    return hours * 60 + minutes;
  });
}
