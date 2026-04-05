import { DEFAULT_SETTINGS } from "../../domain/kot/settings";
import type { ExtensionSettings } from "../../domain/kot/types";
import { getSettings } from "../../platform/webext/storage";

export interface OptionsViewModel {
  defaults: ExtensionSettings;
  settings: ExtensionSettings;
}

export async function getOptionsViewModel(): Promise<OptionsViewModel> {
  const settings = await getSettings();

  return {
    defaults: DEFAULT_SETTINGS,
    settings,
  };
}
