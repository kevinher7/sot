import type { KotDayKind } from "@/domain/kot/monthly-page-types";

export function getKotLeaveCreditMinutes(
  dayKind: KotDayKind,
  standardWorkdayHours: number,
): number {
  if (dayKind === "fullLeave") {
    return standardWorkdayHours * 60;
  }

  if (dayKind === "halfLeave") {
    return standardWorkdayHours * 30;
  }

  return 0;
}
