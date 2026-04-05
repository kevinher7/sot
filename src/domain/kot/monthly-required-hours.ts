export type KotDayKind = "workday" | "offday";

export type MonthlyRequiredHoursResult = {
  workdayCount: number;
  offdayCount: number;
  requiredHours: number;
};

export function calculateMonthlyRequiredHours(
  dayKinds: readonly KotDayKind[],
  standardWorkdayHours: number,
): MonthlyRequiredHoursResult {
  const workdayCount = dayKinds.filter(
    (dayKind) => dayKind === "workday",
  ).length;
  const offdayCount = dayKinds.length - workdayCount;

  return {
    workdayCount,
    offdayCount,
    requiredHours: workdayCount * standardWorkdayHours,
  };
}
