import type { KotTimeCorrectionRequest } from "@/domain/kot/request-data";

export function getKotPendingRequestsForDate(
  requestMap: ReadonlyMap<string, readonly KotTimeCorrectionRequest[]>,
  isoDate: string,
): readonly KotTimeCorrectionRequest[] | undefined {
  return requestMap.get(isoDate);
}
