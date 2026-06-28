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

export function parseClockTextMinuteList(value: string): number[] {
  return Array.from(value.matchAll(/(\d{1,2}):(\d{2})/gu), (match) => {
    const hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);

    return hours * 60 + minutes;
  });
}
