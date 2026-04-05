import type { KotRequestCacheEntry } from "../../domain/kot/request-data";
import type { getSettings } from "../../platform/webext/storage";

export type RefreshReason = "dom" | "minute";

export type RefreshCache = {
  pageSignature: string | null;
  requestContextKey: string | null;
  requestSignature: string | null;
  requestSnapshot: KotRequestCacheEntry | null;
  settingsSignature: string | null;
};

export function createRefreshCache(): RefreshCache {
  return {
    pageSignature: null,
    requestContextKey: null,
    requestSignature: null,
    requestSnapshot: null,
    settingsSignature: null,
  };
}

export function createSettingsSignature(
  settings: Awaited<ReturnType<typeof getSettings>>,
): string {
  return JSON.stringify({
    standardBreakMinutes: settings.standardBreakMinutes,
    standardWorkdayHours: settings.standardWorkdayHours,
  });
}

export function clearRequestCache(cache: RefreshCache): void {
  cache.requestContextKey = null;
  cache.requestSignature = null;
  cache.requestSnapshot = null;
}

export function shouldSyncRequestData(
  reason: RefreshReason,
  nextContextKey: string | null,
  cache: RefreshCache,
  pageSignature: string,
): boolean {
  if (nextContextKey === null) {
    return false;
  }

  if (cache.requestContextKey !== nextContextKey) {
    return true;
  }

  if (cache.requestSnapshot === null) {
    return cache.pageSignature !== pageSignature;
  }

  return reason === "dom" && cache.pageSignature !== pageSignature;
}
