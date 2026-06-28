import type { KotCorrectionNeed } from "@/domain/kot/calculation/requests/correction-need";
import { deriveRequestedPunchView } from "@/domain/kot/correction/requested-punches";
import type {
  KotRequestSyncPayload,
  KotTimeCorrectionRequest,
} from "@/domain/kot/request-data";
import {
  applyKotCorrectionMarkers,
  clearKotCorrectionMarkers,
  type KotCorrectionMarkerOpenHandler,
  type KotCorrectionTone,
} from "@/entrypoints/content/correction-request/marker";
import {
  closeKotCorrectionForm,
  getOpenKotCorrectionFormIsoDate,
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
  pendingRequests: readonly KotTimeCorrectionRequest[];
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

  const pendingRequestsByIsoDate = new Map<
    string,
    KotTimeCorrectionRequest[]
  >();

  for (const request of params.pendingRequests) {
    const bucket = pendingRequestsByIsoDate.get(request.isoDate);

    if (bucket === undefined) {
      pendingRequestsByIsoDate.set(request.isoDate, [request]);

      continue;
    }

    bucket.push(request);
  }

  return (isoDate, row) => {
    // Clicking the 申 button of the day whose panel is already open toggles it
    // shut, so the same button opens and closes the panel.
    if (getOpenKotCorrectionFormIsoDate(doc) === isoDate) {
      closeKotCorrectionForm(doc);

      return;
    }

    const payload = params.payload;

    if (payload === null) {
      return;
    }

    const need = needByIsoDate.get(isoDate);

    void getKotCorrectionForm(payload, isoDate).then((editForm) => {
      if (editForm === null) {
        console.warn(
          `[SOT] 勤務データ編集ページを取得できませんでした: ${isoDate}`,
        );

        return;
      }

      const requestedPunches = deriveRequestedPunchView(
        pendingRequestsByIsoDate.get(isoDate) ?? [],
        editForm,
      );

      openKotCorrectionForm(doc, win, {
        affectedFields: need?.affectedFields ?? [],
        editForm,
        hasPendingRequest:
          (need?.reasons.includes("conflict") ?? false) ||
          params.pendingIsoDates.has(isoDate),
        isoDate,
        onSubmit: (edits) => submitKotCorrectionRequest(editForm, edits),
        onSuccess: params.onSuccess,
        requestedPunches,
        row,
      });
    });
  };
}

// Errors win over conflicts; pending requests without a detected conflict still
// surface as amber so the user can review them.
function deriveKotCorrectionTones(
  params: KotCorrectionSyncParams,
): Map<string, KotCorrectionTone> {
  const tones = new Map<string, KotCorrectionTone>();

  for (const isoDate of params.pendingIsoDates) {
    tones.set(isoDate, "conflict");
  }

  for (const need of params.needs) {
    tones.set(
      need.isoDate,
      need.reasons.includes("error") ? "error" : "conflict",
    );
  }

  return tones;
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
  if (params.payload === null) {
    clearKotCorrectionMarkers(doc);

    return;
  }

  applyKotCorrectionMarkers(
    doc,
    deriveKotCorrectionTones(params),
    createOpenHandler(doc, win, params),
  );
}
