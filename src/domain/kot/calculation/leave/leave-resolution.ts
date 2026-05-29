import type { KotDayKind } from "@/domain/kot/monthly-page-types";
import type {
  KotLeaveKind,
  KotRequestCacheEntry,
} from "@/domain/kot/request-data";

export function createKotApprovedLeaveMap(
  requestCacheEntry: KotRequestCacheEntry | null,
): ReadonlyMap<string, KotLeaveKind> {
  const map = new Map<string, KotLeaveKind>();
  const scheduleLeaveRequests = requestCacheEntry?.scheduleLeaveRequests ?? [];

  for (const request of scheduleLeaveRequests) {
    if (request.status !== "approved") {
      continue;
    }

    map.set(request.isoDate, request.leaveKind);
  }

  return map;
}

export function resolveKotDayKindWithLeave(
  originalDayKind: KotDayKind,
  leaveKind: KotLeaveKind | undefined,
): KotDayKind {
  if (leaveKind === undefined || originalDayKind === "offday") {
    return originalDayKind;
  }

  return leaveKind;
}
