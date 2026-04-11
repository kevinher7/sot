import type { KotDayKind } from "@/domain/kot/monthly-page-types";

export type MonthlyRequiredHoursResult = {
  offdayCount: number;
  requiredHours: number;
  workdayCount: number;
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
    offdayCount,
    requiredHours: workdayCount * standardWorkdayHours,
    workdayCount,
  };
}
