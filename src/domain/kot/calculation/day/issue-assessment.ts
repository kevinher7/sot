import type {
  KotDayIssueSummary,
  KotDayRequestState,
  KotResolvedDayIssueCode,
} from "@/domain/kot/calculation/day/calculation-types";

function isInformationalIssueCode(issueCode: KotResolvedDayIssueCode): boolean {
  return issueCode === "ongoingBreak" || issueCode === "ongoingWork";
}

function isWarningIssueCode(issueCode: KotResolvedDayIssueCode): boolean {
  return issueCode === "requestEstimate";
}

function getRequestIssueCode(
  requestState: KotDayRequestState,
): KotResolvedDayIssueCode | null {
  if (requestState === "applied") {
    return "requestEstimate";
  }

  if (requestState === "conflict") {
    return "requestConflict";
  }

  return null;
}

export function assessKotDayIssues(input: {
  breakIssueCodes: readonly KotResolvedDayIssueCode[];
  requestState: KotDayRequestState;
  rowHasError: boolean;
  timeIssueCodes: readonly KotResolvedDayIssueCode[];
}): KotDayIssueSummary {
  const issueCodeSet = new Set<KotResolvedDayIssueCode>();

  if (input.rowHasError) {
    issueCodeSet.add("rowError");
  }

  const requestIssueCode = getRequestIssueCode(input.requestState);

  if (requestIssueCode !== null) {
    issueCodeSet.add(requestIssueCode);
  }

  input.breakIssueCodes.forEach((issueCode) => {
    issueCodeSet.add(issueCode);
  });
  input.timeIssueCodes.forEach((issueCode) => {
    issueCodeSet.add(issueCode);
  });

  let warningCount = 0;
  let errorCount = 0;

  issueCodeSet.forEach((issueCode) => {
    if (isInformationalIssueCode(issueCode)) {
      return;
    }

    if (isWarningIssueCode(issueCode)) {
      warningCount += 1;

      return;
    }

    errorCount += 1;
  });

  return {
    errorCount,
    issueCodes: [...issueCodeSet],
    resolution:
      errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "normal",
    warningCount,
  };
}
