import type { ExtensionSettings } from "@/domain/kot/types";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  standardBreakMinutes: 60,
  standardWorkdayHours: 8,
};

export function normalizeSettings(
  settings: Partial<ExtensionSettings> | undefined,
): ExtensionSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
}
