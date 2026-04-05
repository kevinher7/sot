import { normalizeSettings } from "@/domain/kot/settings";
import type { KotRequestCacheEntry } from "@/domain/kot/request-data";
import type { ExtensionSettings } from "@/domain/kot/types";
import { getStorageValues, setStorageValues } from "./browser-api";

const SETTINGS_KEY = "settings";
const REQUEST_CACHE_KEY = "kot-request-cache";

type RequestCacheStore = Record<string, KotRequestCacheEntry>;

function createRequestCacheEntryKey(
  employeeId: string,
  year: number,
  month: number,
): string {
  return `${employeeId}:${year}-${month.toString().padStart(2, "0")}`;
}

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await getStorageValues<{
    [SETTINGS_KEY]: Partial<ExtensionSettings> | undefined;
  }>({
    [SETTINGS_KEY]: undefined,
  });

  return normalizeSettings(stored[SETTINGS_KEY]);
}

export async function setSettings(settings: ExtensionSettings): Promise<void> {
  await setStorageValues({
    [SETTINGS_KEY]: normalizeSettings(settings),
  });
}

async function getRequestCacheStore(): Promise<RequestCacheStore> {
  const stored = await getStorageValues<{
    [REQUEST_CACHE_KEY]: RequestCacheStore;
  }>({
    [REQUEST_CACHE_KEY]: {},
  });

  return stored[REQUEST_CACHE_KEY];
}

export async function getCachedRequestEntry(
  employeeId: string,
  year: number,
  month: number,
): Promise<KotRequestCacheEntry | null> {
  const store = await getRequestCacheStore();

  return store[createRequestCacheEntryKey(employeeId, year, month)] ?? null;
}

export async function setCachedRequestEntry(
  entry: KotRequestCacheEntry,
): Promise<KotRequestCacheEntry> {
  const store = await getRequestCacheStore();
  const nextStore: RequestCacheStore = {
    ...store,
    [createRequestCacheEntryKey(entry.employeeId, entry.year, entry.month)]:
      entry,
  };

  await setStorageValues({
    [REQUEST_CACHE_KEY]: nextStore,
  });

  return entry;
}
