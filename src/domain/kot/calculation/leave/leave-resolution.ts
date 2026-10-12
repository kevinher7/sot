import type { KotDayKind } from "@/domain/kot/monthly-page-types";
import type {
  KotRequestCacheEntry,
  KotScheduleRequest,
} from "@/domain/kot/request-data";

export type KotDayScheduleRequests = {
  approved: KotScheduleRequest | undefined;
  latest: KotScheduleRequest;
};

export function createKotScheduleRequestMap(
  requestCacheEntry: KotRequestCacheEntry | null,
): ReadonlyMap<string, KotDayScheduleRequests> {
  const map = new Map<string, KotDayScheduleRequests>();

  for (const request of requestCacheEntry?.scheduleRequests ?? []) {
    if (request.status !== "approved" && request.status !== "pending") {
      continue;
    }

    const previous = map.get(request.isoDate);
    const approved =
      request.status === "approved" &&
      (previous?.approved === undefined ||
        request.requestedAt >= previous.approved.requestedAt)
        ? request
        : previous?.approved;
    const latest =
      previous === undefined ||
      request.requestedAt >= previous.latest.requestedAt
        ? request
        : previous.latest;

    map.set(request.isoDate, { approved, latest });
  }

  return map;
}

export function resolveKotDayKindWithSchedule(
  originalDayKind: KotDayKind,
  scheduleKind: KotScheduleRequest["scheduleKind"] | undefined,
): KotDayKind {
  if (scheduleKind === undefined || originalDayKind === "offday") {
    return originalDayKind;
  }

  return scheduleKind;
}
