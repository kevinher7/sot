import { normalizeSettings } from "../../domain/kot/settings";
import type { ExtensionSettings } from "../../domain/kot/types";
import { getStorageValues, setStorageValues } from "./browser-api";

const SETTINGS_KEY = "settings";

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
