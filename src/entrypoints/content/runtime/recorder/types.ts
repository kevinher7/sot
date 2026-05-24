export type RecordAction =
  | "clock-in"
  | "break-start"
  | "break-end"
  | "clock-out";

export type RecordActionResult = { ok: true } | { ok: false; reason: string };

export type RecorderFormData = {
  actionUrl: string;
  csrfToken: string;
  hiddenFields: Record<string, string>;
};
