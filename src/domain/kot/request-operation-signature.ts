import type { KotRequestOperation } from "@/domain/kot/request-data";

export function createKotRequestOperationSignature(
  operation: KotRequestOperation,
): string {
  if (operation.type === "delete") {
    return ["delete", operation.label, operation.minutes].join("|");
  }

  const breakStart = operation.timePatch.breakStartMinutes?.join(",") ?? "-";
  const breakEnd = operation.timePatch.breakEndMinutes?.join(",") ?? "-";

  const supersededEntriesPart =
    operation.supersededEntries.length > 0
      ? operation.supersededEntries
          .map((entry) => `${entry.label}:${entry.minutes}`)
          .join(",")
      : "-";

  return [
    "patch",
    operation.timePatch.clockInMinutes ?? "-",
    operation.timePatch.clockOutMinutes ?? "-",
    breakStart,
    breakEnd,
    supersededEntriesPart,
  ].join("|");
}
