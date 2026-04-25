export type KotRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "unknown";

export type KotRequestTimeLabel =
  | "clockIn"
  | "clockOut"
  | "breakStart"
  | "breakEnd";

export type KotRequestTimePatch = {
  breakEndMinutes?: readonly number[];
  breakStartMinutes?: readonly number[];
  clockInMinutes?: number;
  clockOutMinutes?: number;
};

export type KotRequestOperation =
  | {
      supersededEntries: readonly {
        label: KotRequestTimeLabel;
        minutes: number;
      }[];
      timePatch: KotRequestTimePatch;
      type: "patch";
    }
  | {
      label: KotRequestTimeLabel;
      minutes: number;
      type: "delete";
    };

export type KotTimeCorrectionRequest = {
  cacheKey: string;
  employeeId: string;
  isoDate: string;
  label: string;
  operation: KotRequestOperation;
  status: KotRequestStatus;
  updatedAt: number;
};

export type KotRequestCacheEntry = {
  employeeId: string;
  month: number;
  requests: readonly KotTimeCorrectionRequest[];
  signature: string;
  syncedAt: number;
  year: number;
};

export type KotRequestSyncPayload = {
  adminBaseUrl: string;
  employeeId: string;
  month: number;
  preserveQueryParams: Record<string, string>;
  year: number;
};

export type KotGetRequestDataMessage = {
  payload: KotRequestSyncPayload;
  type: "kot:get-request-data";
};

export type KotGetRequestDataSuccessResponse = {
  data: KotRequestCacheEntry;
  ok: true;
};

export type KotGetRequestDataErrorResponse = {
  message: string;
  ok: false;
};

export type KotGetRequestDataResponse =
  | KotGetRequestDataSuccessResponse
  | KotGetRequestDataErrorResponse;
