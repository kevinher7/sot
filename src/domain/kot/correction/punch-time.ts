const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/u;

export function isValidKotPunchTime(value: string): boolean {
  return TIME_PATTERN.test(value.trim());
}

export function normalizeKotPunchTime(value: string): string {
  const text = value.trim().replace(/[０-９：]/gu, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0xfee0),
  );
  let candidate = text;

  if (/^\d{3,4}$/u.test(text)) {
    candidate = `${text.slice(0, -2).padStart(2, "0")}:${text.slice(-2)}`;
  } else if (/^\d:\d{2}$/u.test(text)) {
    candidate = text.padStart(5, "0");
  }

  return isValidKotPunchTime(candidate) ? candidate : value;
}
