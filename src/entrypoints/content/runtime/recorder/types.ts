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

export type GatewayPayload = {
  id: string;
  user_token: string;
  token: string;
  browser_id: string;
  unique_timestamp: string;
  d_param: string;
  credential_code: string;
  highAccuracyFlg: string;
  latitude: string;
  longitude: string;
  highAcPos: string;
  lowAcPos: string;
  record_image: string;
  timerecorder_id: string;
};
