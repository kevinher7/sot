import type { RefreshReason } from "@/entrypoints/content/runtime/state";

export type RefreshCoordinator = {
  queueRefresh: (reason: RefreshReason) => Promise<void>;
  scheduleRefresh: (reason: RefreshReason) => void;
};

export function createRefreshCoordinator(
  win: Window,
  runRefresh: (reason: RefreshReason) => Promise<void>,
): RefreshCoordinator {
  let refreshScheduled = false;
  let refreshInFlight = false;
  let queuedReason: RefreshReason | null = null;

  const mergeRefreshReason = (
    current: RefreshReason | null,
    next: RefreshReason,
  ): RefreshReason => {
    if (current === "minute" || next === "minute") {
      return "minute";
    }

    return "dom";
  };

  const queueRefresh = async (reason: RefreshReason): Promise<void> => {
    if (refreshInFlight) {
      queuedReason = mergeRefreshReason(queuedReason, reason);

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
      queuedReason = mergeRefreshReason(queuedReason, reason);

      return;
    }

    refreshScheduled = true;
    win.requestAnimationFrame(() => {
      const nextReason = mergeRefreshReason(queuedReason, reason);

      refreshScheduled = false;
      queuedReason = null;
      void queueRefresh(nextReason);
    });
  };

  return {
    queueRefresh,
    scheduleRefresh,
  };
}
