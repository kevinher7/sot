import { calculateOverlayMetrics } from "@/domain/kot/overlay-calculations";
import { getNow, getDelayUntilNextMinute } from "@/platform/time/clock";
import { getSettings } from "@/platform/webext/storage";
import { createOverlayViewModel } from "@/entrypoints/content/model";
import { ensureOverlayRoot } from "@/entrypoints/content/overlay-root";
import {
  renderOverlayError,
  renderOverlayResult,
} from "@/entrypoints/content/overlay-renderer";
import { readMonthlyPageSnapshot } from "@/entrypoints/content/page-reader";
import { createKotRequestContext } from "@/entrypoints/content/request-context";
import { getKotRequestData } from "@/entrypoints/content/request-sync";
import { observeDocumentChanges } from "@/entrypoints/content/runtime-dom";
import {
  clearRequestCache,
  createRefreshCache,
  createSettingsSignature,
  shouldSyncRequestData,
  type RefreshReason,
} from "@/entrypoints/content/runtime-state";

export async function startMonthlyRequiredHoursRuntime(
  win: Window = window,
  doc: Document = document,
): Promise<void> {
  let refreshScheduled = false;
  let nextMinuteTimerId: number | null = null;
  let refreshInFlight = false;
  let queuedReason: RefreshReason | null = null;
  const cache = createRefreshCache();

  try {
    const root = ensureOverlayRoot(doc);

    const scheduleNextMinuteRefresh = (): void => {
      if (nextMinuteTimerId !== null) {
        win.clearTimeout(nextMinuteTimerId);
      }

      const delay = getDelayUntilNextMinute(getNow());

      nextMinuteTimerId = win.setTimeout(() => {
        void queueRefresh("minute");
      }, delay);
    };

    const runRefresh = async (reason: RefreshReason): Promise<void> => {
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
      const model = createOverlayViewModel(now, result, settings);

      renderOverlayResult(root, doc, model);
      cache.pageSignature = pageSnapshot.signature;
      cache.requestContextKey = requestContext?.key ?? null;
      cache.requestSignature = cache.requestSnapshot?.signature ?? null;
      cache.settingsSignature = settingsSignature;
      scheduleNextMinuteRefresh();
    };

    const queueRefresh = async (reason: RefreshReason): Promise<void> => {
      if (refreshInFlight) {
        queuedReason =
          queuedReason === "minute" || reason === "minute" ? "minute" : "dom";

        return;
      }

      refreshInFlight = true;

      try {
        await runRefresh(reason);
      } finally {
        refreshInFlight = false;

        if (queuedReason !== null) {
          const nextReason = queuedReason;

          queuedReason = null;
          await queueRefresh(nextReason);
        }
      }
    };

    const scheduleRefresh = (reason: RefreshReason): void => {
      if (refreshScheduled) {
        queuedReason =
          queuedReason === "minute" || reason === "minute" ? "minute" : "dom";

        return;
      }

      refreshScheduled = true;
      win.requestAnimationFrame(() => {
        refreshScheduled = false;
        void queueRefresh(queuedReason === "minute" ? "minute" : reason);
        queuedReason = null;
      });
    };

    observeDocumentChanges(doc, () => {
      scheduleRefresh("dom");
    });

    await queueRefresh("minute");
  } catch (error) {
    if (nextMinuteTimerId !== null) {
      win.clearTimeout(nextMinuteTimerId);
    }

    const root = ensureOverlayRoot(doc);

    renderOverlayError(
      root,
      doc,
      error instanceof Error
        ? error.message
        : "Failed to render extension overlay.",
    );
  }
}
