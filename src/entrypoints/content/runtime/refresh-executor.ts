import { detectKotCorrectionNeeds } from "@/domain/kot/projection/correction-projection";
import { calculateOverlayMetrics } from "@/domain/kot/projection/overlay-metrics";
import { buildKotBreakWarnings } from "@/domain/kot/projection/break-warning";
import { buildKotRequestInjections } from "@/domain/kot/projection/request-injection";
import {
  countOfficeDays,
  resolveWorkplace,
  type Workplace,
  type WorkplaceChoices,
} from "@/domain/kot/workplace";
import type { KotMonthlyPageSnapshot } from "@/domain/kot/monthly-page-types";
import {
  closeKotCorrectionForm,
  syncKotCorrectionMarkers,
} from "@/entrypoints/content/correction-request";
import { readMonthlyPageSnapshot } from "@/entrypoints/content/kot-page";
import { startAutoClockOut } from "@/entrypoints/content/runtime/auto-clock-out";
import { applyTodayRowHighlight } from "@/entrypoints/content/runtime/day-highlight";
import { applyKotBreakWarnings } from "@/entrypoints/content/runtime/break-warning";
import { applyKotRequestInjections } from "@/entrypoints/content/runtime/request-injection";
import {
  applyWorkplaceMarkers,
  clearWorkplaceMarkers,
  type WorkplaceMarkerState,
} from "@/entrypoints/content/runtime/workplace-marker";
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
import { createIsoDateKey } from "@/domain/kot/date";
import { getNow } from "@/platform/time/clock";
import type { WorkMode } from "@/domain/kot/types";
import {
  getSettings,
  getWorkplaceChoices,
  setAutoClockOutAtTen,
  setExcludeNightWorkFromBank,
  setMetricView,
  setWorkMode,
  setWorkplaceChoice,
} from "@/platform/webext/storage";

function createWorkplaceMarkerStates(
  pageSnapshot: KotMonthlyPageSnapshot,
  choices: WorkplaceChoices,
): Map<string, WorkplaceMarkerState> {
  return new Map(
    pageSnapshot.rows.map((row) => [
      row.isoDate,
      row.hasClockIn ? resolveWorkplace(choices, row.isoDate) : "none",
    ]),
  );
}

export function createRefreshExecutor(
  win: Window,
  doc: Document,
  root: HTMLDivElement,
  cache: RefreshCache,
  scheduleNextMinuteRefresh: () => void,
  queueModeRefresh: () => void,
): (reason: RefreshReason) => Promise<void> {
  let stopAutoClockOut: (() => void) | undefined;

  win.addEventListener("pagehide", () => {
    stopAutoClockOut?.();
    stopAutoClockOut = undefined;
  });

  return async (reason: RefreshReason): Promise<void> => {
    const now = getNow();

    applyTodayRowHighlight(doc, now);

    const settings = await getSettings();

    if (settings.autoClockOutAtTen && stopAutoClockOut === undefined) {
      stopAutoClockOut = startAutoClockOut(win, doc, (message) => {
        renderOverlayError(root, doc, message);
      });
    } else if (!settings.autoClockOutAtTen) {
      stopAutoClockOut?.();
      stopAutoClockOut = undefined;
    }

    const pageSnapshot = readMonthlyPageSnapshot(now, doc);

    if (pageSnapshot === null) {
      renderOverlayError(
        root,
        doc,
        "Monthly timecard data is not available on this page.",
      );
      applyKotRequestInjections(doc, []);
      applyKotBreakWarnings(doc, []);
      clearWorkplaceMarkers(doc);
      cache.pageSignature = null;
      clearRequestCache(cache);
      cache.settingsSignature = null;
      cache.workplaceSignature = null;
      closeKotCorrectionForm(doc);
      syncKotCorrectionMarkers(doc, win, {
        needs: [],
        onSuccess: () => {},
        payload: null,
        pendingIsoDates: new Set(),
        pendingScheduleIsoDates: new Set(),
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

    const result = calculateOverlayMetrics({
      now,
      pageSnapshot,
      requestCacheEntry: cache.requestSnapshot,
      settings,
    });

    // Re-apply on every refresh (like the today-row highlight) so the amber
    // request times survive host re-renders; reconciliation makes it a no-op
    // when nothing changed.
    applyKotRequestInjections(
      doc,
      buildKotRequestInjections(result.resolvedMonth),
    );
    applyKotBreakWarnings(doc, buildKotBreakWarnings(result.resolvedMonth));

    const employeeId = requestContext?.payload.employeeId ?? null;
    const workplaceChoices =
      employeeId === null ? null : await getWorkplaceChoices(employeeId);
    const workplaceSignature = JSON.stringify(workplaceChoices);

    if (employeeId === null || workplaceChoices === null) {
      clearWorkplaceMarkers(doc);
    } else {
      applyWorkplaceMarkers(
        doc,
        createWorkplaceMarkerStates(pageSnapshot, workplaceChoices),
        (isoDate, next) => {
          void setWorkplaceChoice(employeeId, isoDate, next).then(() => {
            queueModeRefresh();
          });
        },
      );
    }

    const shouldSkipRender =
      reason === "dom" &&
      cache.pageSignature === pageSnapshot.signature &&
      cache.settingsSignature === settingsSignature &&
      cache.workplaceSignature === workplaceSignature &&
      cache.requestContextKey === (requestContext?.key ?? null) &&
      cache.requestSignature === (cache.requestSnapshot?.signature ?? null);

    if (shouldSkipRender) {
      scheduleNextMinuteRefresh();

      return;
    }

    const model = createOverlayViewModel(
      now,
      result,
      settings,
      getPendingAction(),
      workplaceChoices === null
        ? undefined
        : countOfficeDays(pageSnapshot.rows, workplaceChoices),
      employeeId !== null,
    );

    renderOverlayResult(root, doc, model, {
      onClockInWithWorkplace: (workplace: Workplace) => {
        const saveChoice =
          employeeId === null
            ? Promise.resolve()
            : setWorkplaceChoice(
                employeeId,
                createIsoDateKey(getNow()),
                workplace,
              );

        // Run side by side so a slow or failed save can't delay or block the
        // punch.
        void Promise.allSettled([
          saveChoice,
          submitRecordAction("clock-in"),
        ]).then(() => {
          win.location.reload();
        });
      },
      onToggleAutoClockOut: (next) => {
        if (!next) {
          stopAutoClockOut?.();
          stopAutoClockOut = undefined;
        }

        void setAutoClockOutAtTen(next).then(() => {
          queueModeRefresh();
        });
      },
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
      pendingScheduleIsoDates: correction.pendingScheduleIsoDates,
      pendingRequests: (cache.requestSnapshot?.requests ?? []).filter(
        (request) => request.status === "pending",
      ),
    });

    cache.pageSignature = pageSnapshot.signature;
    cache.requestContextKey = requestContext?.key ?? null;
    cache.requestSignature = cache.requestSnapshot?.signature ?? null;
    cache.settingsSignature = settingsSignature;
    cache.workplaceSignature = workplaceSignature;
    scheduleNextMinuteRefresh();
  };
}
