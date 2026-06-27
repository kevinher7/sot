import { buildKotCorrectionPayload } from "@/domain/kot/correction/payload";
import type { KotEditForm, KotPunchEdit } from "@/domain/kot/correction/types";
import type { KotRequestSyncPayload } from "@/domain/kot/request-data";
import { readKotEditFormFromHtml } from "@/entrypoints/content/correction-request/edit-page-reader";
import { WORKING_EDIT_PAGE_ID } from "@/entrypoints/content/correction-request/contracts";

export type KotCorrectionSubmitResult =
  | { ok: true }
  | { ok: false; reason: string };

function toWorkingDateParam(isoDate: string): string {
  return isoDate.replace(/-/gu, "");
}

// Best-effort edit-page URL, mirroring the existing request-list GET. The exact
// query shape must be confirmed against a live working_edit page.
function buildEditPageUrl(
  payload: KotRequestSyncPayload,
  isoDate: string,
): string {
  const url = new URL(payload.adminBaseUrl);

  Object.entries(payload.preserveQueryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  url.searchParams.set("page_id", WORKING_EDIT_PAGE_ID);
  url.searchParams.set("employee_id", payload.employeeId);
  url.searchParams.set("working_date", toWorkingDateParam(isoDate));

  return url.toString();
}

export async function getKotCorrectionForm(
  payload: KotRequestSyncPayload,
  isoDate: string,
): Promise<KotEditForm | null> {
  const editPageUrl = buildEditPageUrl(payload, isoDate);
  const response = await fetch(editPageUrl, {
    credentials: "include",
    method: "GET",
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();

  return readKotEditFormFromHtml(html, editPageUrl);
}

export async function submitKotCorrectionRequest(
  form: KotEditForm,
  edits: readonly KotPunchEdit[],
): Promise<KotCorrectionSubmitResult> {
  const entries = buildKotCorrectionPayload(form, edits);
  const body = new FormData();

  for (const entry of entries) {
    body.append(entry.name, entry.value);
  }

  try {
    // Let fetch set the multipart boundary; do not set Content-Type manually.
    const response = await fetch(form.actionUrl, {
      body,
      credentials: "include",
      method: "POST",
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `申請の送信に失敗しました (${response.status})`,
      };
    }

    // NOTE: success is currently inferred from the HTTP status. KOT returns a
    // full HTML page; real success-vs-error parsing of that response is a
    // deliberate follow-up.
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error ? error.message : "申請の送信に失敗しました",
    };
  }
}
