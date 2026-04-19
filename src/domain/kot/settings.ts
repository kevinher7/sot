import type { ExtensionSettings, WorkMode } from "@/domain/kot/types";

function normalizeWorkMode(workMode: string | undefined): WorkMode {
  return workMode === "intern" ? "intern" : "full";
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  standardBreakMinutes: 60,
  standardWorkdayHours: 8,
  workMode: "full",
};

export function normalizeSettings(
  settings: Partial<ExtensionSettings> | undefined,
): ExtensionSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    workMode: normalizeWorkMode(settings?.workMode),
  };
}
