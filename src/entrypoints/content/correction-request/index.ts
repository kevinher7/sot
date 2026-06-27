import type { KotCorrectionNeed } from "@/domain/kot/calculation/requests/correction-need";
import type { KotRequestSyncPayload } from "@/domain/kot/request-data";
import {
  applyKotCorrectionMarkers,
  type KotCorrectionMarkerOpenHandler,
} from "@/entrypoints/content/correction-request/marker";
import {
  closeKotCorrectionForm,
  openKotCorrectionForm,
} from "@/entrypoints/content/correction-request/form-panel";
import {
  getKotCorrectionForm,
  submitKotCorrectionRequest,
} from "@/entrypoints/content/correction-request/service";

export type { KotCorrectionMarkerOpenHandler };

export type KotCorrectionSyncParams = {
  needs: readonly KotCorrectionNeed[];
  payload: KotRequestSyncPayload | null;
  pendingIsoDates: ReadonlySet<string>;
  onSuccess: () => void;
};

function createOpenHandler(
  doc: Document,
  win: Window,
  params: KotCorrectionSyncParams,
): KotCorrectionMarkerOpenHandler {
  const needByIsoDate = new Map(
    params.needs.map((need) => [need.isoDate, need]),
  );

  return (isoDate, row) => {
    const need = needByIsoDate.get(isoDate);
    const payload = params.payload;

    if (need === undefined || payload === null) {
      return;
    }

    void getKotCorrectionForm(payload, isoDate).then((editForm) => {
      if (editForm === null) {
        console.warn(
          `[SOT] 勤務データ編集ページを取得できませんでした: ${isoDate}`,
        );

        return;
      }

      openKotCorrectionForm(doc, win, {
        editForm,
        hasPendingRequest:
          need.reasons.includes("conflict") ||
          params.pendingIsoDates.has(isoDate),
        need,
        onSubmit: (edits) => submitKotCorrectionRequest(editForm, edits),
        onSuccess: params.onSuccess,
        row,
      });
    });
  };
}

export { closeKotCorrectionForm };

// Rebuilt each refresh cycle: re-apply the per-row markers for the current set
// of flagged days. The open form is intentionally NOT closed here so benign
// minute/DOM refreshes don't interrupt an in-progress edit; callers close it
// explicitly when the underlying table DOM actually changes.
export function syncKotCorrectionMarkers(
  doc: Document,
  win: Window,
  params: KotCorrectionSyncParams,
): void {
  applyKotCorrectionMarkers(
    doc,
    params.payload === null ? [] : params.needs,
    createOpenHandler(doc, win, params),
  );
}
