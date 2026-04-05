type StoragePayload = Record<string, unknown>;

type BrowserApi = typeof browser;

export function getBrowserApi(): BrowserApi {
  const runtime = globalThis as typeof globalThis & {
    browser?: BrowserApi;
    chrome?: BrowserApi;
  };

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
  const result = await api.storage.local.get(defaults);

  return result as T;
}

export async function setStorageValues(values: StoragePayload): Promise<void> {
  const api = getBrowserApi();
  await api.storage.local.set(values);
}

export async function sendRuntimeMessage<TResponse>(
  message: unknown,
): Promise<TResponse> {
  const api = getBrowserApi();
  return (await api.runtime.sendMessage(message)) as TResponse;
}
