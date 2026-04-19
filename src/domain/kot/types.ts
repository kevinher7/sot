export type WorkMode = "full" | "intern";

export type ExtensionSettings = {
  standardBreakMinutes: number;
  standardWorkdayHours: number;
  workMode: WorkMode;
};
