import type Browser from "webextension-polyfill";

type StoragePayload = Record<string, unknown>;

type WebExtensionApi = typeof Browser;

type WebExtensionApiRuntime = typeof globalThis & {
  browser?: WebExtensionApi;
  chrome?: WebExtensionApi;
};

function getRuntime(): WebExtensionApiRuntime {
  return globalThis as WebExtensionApiRuntime;
}

export function getBrowserApi(): WebExtensionApi {
  const runtime = getRuntime();

  if (runtime.browser) {
    return runtime.browser;
  }

  if (runtime.chrome) {
    return runtime.chrome;
  }

  throw new Error("WebExtension browser API is unavailable in this context.");
}

export async function getStorageValues<T extends StoragePayload>(
  defaults: T,
): Promise<T> {
  const api = getBrowserApi();

  return (await api.storage.local.get(defaults)) as T;
}

export async function setStorageValues(values: StoragePayload): Promise<void> {
  const api = getBrowserApi();

  await api.storage.local.set(values);
}

export async function sendRuntimeMessage<TResponse>(
  message: unknown,
): Promise<TResponse> {
  const api = getBrowserApi();

  return api.runtime.sendMessage(message);
}
