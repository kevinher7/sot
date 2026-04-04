import { getStorageValues, setStorageValues } from "./browser";
import { DEFAULT_SETTINGS } from "./settings";
import type { ExtensionSettings } from "./types";

const SETTINGS_KEY = "settings";

export async function loadSettings(): Promise<ExtensionSettings> {
  const stored = await getStorageValues({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  return stored[SETTINGS_KEY] as ExtensionSettings;
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await setStorageValues({ [SETTINGS_KEY]: settings });
}
