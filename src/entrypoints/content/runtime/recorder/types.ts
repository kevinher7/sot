export type RecordAction =
  | "clock-in"
  | "break-start"
  | "break-end"
  | "clock-out";

export type RecordActionResult = { ok: true } | { ok: false; reason: string };

export type RecorderButton = {
  name: string;
  id: string;
  color: string;
  mark: string;
};

export type RecorderSettings = {
  userToken: string;
  token: string;
  buttons: readonly RecorderButton[];
};
