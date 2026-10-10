import { calculateTodayBadgeStatus } from "@/domain/kot/projection/overlay-metrics";
import { readMonthlyPageSnapshot } from "@/entrypoints/content/kot-page";
import { createKotRequestContext } from "@/entrypoints/content/request-enrichment";
import {
  getPendingAction,
  submitRecordAction,
} from "@/entrypoints/content/runtime/recorder";
import { getNow } from "@/platform/time/clock";
import { claimAutoClockOut, getSettings } from "@/platform/webext/storage";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function isClockOutMinute(now: Date): boolean {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);

  return jst.getUTCHours() === 22 && jst.getUTCMinutes() === 0;
}

export function startAutoClockOut(
  win: Window,
  doc: Document,
  onError: (message: string) => void,
): () => void {
  let timerId: number | undefined;
  let stopped = false;

  async function attemptClockOut(): Promise<void> {
    try {
      await win.navigator.locks.request("sot-auto-clock-out", async () => {
        if (stopped || !isClockOutMinute(getNow())) {
          return;
        }

        const response = await fetch(win.location.href, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not refresh today's working status.");
        }

        const freshDoc = new DOMParser().parseFromString(
          await response.text(),
          "text/html",
        );
        const jst = new Date(getNow().getTime() + JST_OFFSET_MS);
        // The existing page reader and status calculation use local date fields.
        const now = new Date(
          jst.getUTCFullYear(),
          jst.getUTCMonth(),
          jst.getUTCDate(),
          jst.getUTCHours(),
          jst.getUTCMinutes(),
        );
        const snapshot = readMonthlyPageSnapshot(now, freshDoc);
        const currentSnapshot = readMonthlyPageSnapshot(now, doc);

        if (snapshot === null || currentSnapshot === null) {
          return;
        }

        const url = new URL(win.location.href);
        const context = createKotRequestContext(snapshot, url, freshDoc);
        const currentContext = createKotRequestContext(currentSnapshot, url, doc);

        if (
          context === null ||
          currentContext === null ||
          context.payload.employeeId !== currentContext.payload.employeeId
        ) {
          return;
        }

        const settings = await getSettings();
        const status = calculateTodayBadgeStatus({
          now,
          pageSnapshot: snapshot,
          requestCacheEntry: null,
          standardWorkdayHours: settings.standardWorkdayHours,
        });

        if (
          stopped ||
          !settings.autoClockOutAtTen ||
          (status !== "in-progress" && status !== "night") ||
          getPendingAction() !== null ||
          !isClockOutMinute(getNow())
        ) {
          return;
        }

        const isoDate = jst.toISOString().slice(0, 10);
        const claimed = await claimAutoClockOut(
          context.payload.employeeId,
          isoDate,
        );

        if (
          !claimed ||
          stopped ||
          getPendingAction() !== null ||
          !isClockOutMinute(getNow())
        ) {
          return;
        }

        const result = await submitRecordAction("clock-out");

        if (!result.ok) {
          throw new Error(result.reason);
        }

        win.location.reload();
      });
    } catch (error) {
      if (!stopped) {
        onError(
          `Automatic clock-out failed. Check KOT before retrying manually. ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  function checkAndSchedule(): void {
    const now = getNow();

    if (isClockOutMinute(now)) {
      void attemptClockOut();
    }

    const jst = new Date(now.getTime() + JST_OFFSET_MS);

    jst.setUTCHours(22, 0, 0, 0);
    let nextCheck = jst.getTime() - JST_OFFSET_MS;

    if (nextCheck <= now.getTime()) {
      nextCheck += DAY_MS;
    }

    timerId = win.setTimeout(checkAndSchedule, nextCheck - now.getTime());
  }

  checkAndSchedule();

  return () => {
    stopped = true;
    win.clearTimeout(timerId);
  };
}
