import { calculateOverlayMetrics } from "@/domain/kot/projection/overlay-metrics";
import { getNow } from "@/platform/time/clock";
import { getSettings } from "@/platform/webext/storage";
import { readMonthlyPageSnapshot } from "@/entrypoints/content/kot-page";
import {
  createKotRequestContext,
  getKotRequestData,
} from "@/entrypoints/content/request-enrichment";
import {
  createOverlayViewModel,
  renderOverlayError,
  renderOverlayResult,
} from "@/entrypoints/content/runtime/overlay";
import {
  clearRequestCache,
  createSettingsSignature,
  shouldSyncRequestData,
  type RefreshCache,
  type RefreshReason,
} from "@/entrypoints/content/runtime/state";

export function createRefreshExecutor(
  win: Window,
  doc: Document,
  root: HTMLDivElement,
  cache: RefreshCache,
  scheduleNextMinuteRefresh: () => void,
): (reason: RefreshReason) => Promise<void> {
  return async (reason: RefreshReason): Promise<void> => {
    const now = getNow();
    const settings = await getSettings();
    const pageSnapshot = readMonthlyPageSnapshot(now, doc);

    if (pageSnapshot === null) {
      renderOverlayError(
        root,
        doc,
        "Monthly timecard data is not available on this page.",
      );
      cache.pageSignature = null;
      clearRequestCache(cache);
      cache.settingsSignature = null;
      scheduleNextMinuteRefresh();

      return;
    }

    const currentUrl = new URL(win.location.href);
    const requestContext = createKotRequestContext(pageSnapshot, currentUrl, doc);
    const settingsSignature = createSettingsSignature(settings);

    if (requestContext === null) {
      clearRequestCache(cache);
    }

    if (
      shouldSyncRequestData(
        reason,
        requestContext?.key ?? null,
        cache,
        pageSnapshot.signature,
      )
    ) {
      cache.requestSnapshot =
        requestContext === null ? null : await getKotRequestData(requestContext);
      cache.requestContextKey = requestContext?.key ?? null;
      cache.requestSignature = cache.requestSnapshot?.signature ?? null;
    }

    const shouldSkipRender =
      reason === "dom" &&
      cache.pageSignature === pageSnapshot.signature &&
      cache.settingsSignature === settingsSignature &&
      cache.requestContextKey === (requestContext?.key ?? null) &&
      cache.requestSignature === (cache.requestSnapshot?.signature ?? null);

    if (shouldSkipRender) {
      scheduleNextMinuteRefresh();

      return;
    }

    const result = calculateOverlayMetrics({
      now,
      pageSnapshot,
      requestCacheEntry: cache.requestSnapshot,
      settings,
    });
    const model = createOverlayViewModel(now, result, settings);

    renderOverlayResult(root, doc, model);
    cache.pageSignature = pageSnapshot.signature;
    cache.requestContextKey = requestContext?.key ?? null;
    cache.requestSignature = cache.requestSnapshot?.signature ?? null;
    cache.settingsSignature = settingsSignature;
    scheduleNextMinuteRefresh();
  };
}
