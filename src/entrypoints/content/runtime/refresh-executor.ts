import { detectKotCorrectionNeeds } from "@/domain/kot/projection/correction-projection";
import { calculateOverlayMetrics } from "@/domain/kot/projection/overlay-metrics";
import {
  closeKotCorrectionForm,
  syncKotCorrectionMarkers,
} from "@/entrypoints/content/correction-request";
import { readMonthlyPageSnapshot } from "@/entrypoints/content/kot-page";
import { applyTodayRowHighlight } from "@/entrypoints/content/runtime/day-highlight";
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
  getPendingAction,
  submitRecordAction,
} from "@/entrypoints/content/runtime/recorder";
import {
  clearRequestCache,
  createSettingsSignature,
  type RefreshCache,
  type RefreshReason,
  shouldSyncRequestData,
} from "@/entrypoints/content/runtime/state";
import { getNow } from "@/platform/time/clock";
import type { WorkMode } from "@/domain/kot/types";
import {
  getSettings,
  setExcludeNightWorkFromBank,
  setMetricView,
  setWorkMode,
} from "@/platform/webext/storage";

export function createRefreshExecutor(
  win: Window,
  doc: Document,
  root: HTMLDivElement,
  cache: RefreshCache,
  scheduleNextMinuteRefresh: () => void,
  queueModeRefresh: () => void,
): (reason: RefreshReason) => Promise<void> {
  return async (reason: RefreshReason): Promise<void> => {
    const now = getNow();

    applyTodayRowHighlight(doc, now);

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
      closeKotCorrectionForm(doc);
      syncKotCorrectionMarkers(doc, win, {
        needs: [],
        onSuccess: () => {},
        payload: null,
        pendingIsoDates: new Set(),
        pendingRequests: [],
      });
      scheduleNextMinuteRefresh();

      return;
    }

    const currentUrl = new URL(win.location.href);
    const requestContext = createKotRequestContext(
      pageSnapshot,
      currentUrl,
      doc,
    );
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
        requestContext === null
          ? null
          : await getKotRequestData(requestContext);
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
    const model = createOverlayViewModel(
      now,
      result,
      settings,
      getPendingAction(),
    );

    renderOverlayResult(root, doc, model, {
      onRecordAction: (action) => {
        void submitRecordAction(action).then(() => {
          win.location.reload();
        });
      },
      onSelectWorkMode: (workMode: WorkMode) => {
        if (workMode === settings.workMode) {
          return;
        }

        void setWorkMode(workMode).then(() => {
          queueModeRefresh();
        });
      },
      onToggleMetricView: (binding) => {
        void setMetricView(binding.viewKey, binding.nextView).then(() => {
          queueModeRefresh();
        });
      },
      onToggleNightWorkExclusion: (next) => {
        if (next === settings.excludeNightWorkFromBank) {
          return;
        }

        void setExcludeNightWorkFromBank(next).then(() => {
          queueModeRefresh();
        });
      },
    });

    // Close any open correction form when the table DOM actually changed (its
    // row anchor is now stale); benign re-renders leave the form intact.
    if (cache.pageSignature !== pageSnapshot.signature) {
      closeKotCorrectionForm(doc);
    }

    const correction = detectKotCorrectionNeeds(result.resolvedMonth);

    syncKotCorrectionMarkers(doc, win, {
      needs: correction.needs,
      onSuccess: () => {
        win.location.reload();
      },
      payload: requestContext?.payload ?? null,
      pendingIsoDates: correction.pendingIsoDates,
      pendingRequests: (cache.requestSnapshot?.requests ?? []).filter(
        (request) => request.status === "pending",
      ),
    });

    cache.pageSignature = pageSnapshot.signature;
    cache.requestContextKey = requestContext?.key ?? null;
    cache.requestSignature = cache.requestSnapshot?.signature ?? null;
    cache.settingsSignature = settingsSignature;
    scheduleNextMinuteRefresh();
  };
}
