export function getNow(): Date {
  return new Date();
}

export function getDelayUntilNextMinute(now: Date): number {
  const nextMinute = new Date(now);

  nextMinute.setSeconds(0, 0);
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);

  return Math.max(0, nextMinute.getTime() - now.getTime());
}
