export function parseClockTextMinutes(value: string): number | null {
  const match = value.match(/(\d{1,2}):(\d{2})/u);

  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  return hours * 60 + minutes;
}

export function parseClockTextMinuteList(value: string): number[] {
  return Array.from(value.matchAll(/(\d{1,2}):(\d{2})/gu), (match) => {
    const hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);

    return hours * 60 + minutes;
  });
}
