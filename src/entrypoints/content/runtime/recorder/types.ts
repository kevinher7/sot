export type RecordAction =
  | "clock-in"
  | "break-start"
  | "break-end"
  | "clock-out";

export type RecordActionResult = { ok: true } | { ok: false; reason: string };

export type KotRecorderButton = {
  name: string;
  id: string;
  color: string;
  mark: string;
};

export type KotRecorderSettings = {
  userToken: string;
  token: string;
  buttons: readonly KotRecorderButton[];
};
