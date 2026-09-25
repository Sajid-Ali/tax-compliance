import type { Filing, FilingStatus } from "./types";

export type GateStatus = "pending" | "passed" | "blocked";

export interface GateInfo {
  label: string;
  status: GateStatus;
  timestamp?: string | null;
}

/**
 * Maps the real filing/deadline state to the 3 gates a filing passes
 * through. Deliberately reads only the fields the schema actually has
 * (reviewer_notes/approved_at/filed_at) — no invented gate types.
 */
export function deriveFilingGates(
  filing: Pick<Filing, "reviewer_notes" | "approved_at" | "filed_at"> | null,
  deadlineStatus: FilingStatus
): GateInfo[] {
  const draftPending = deadlineStatus === "upcoming" || deadlineStatus === "reminder_sent";

  const reviewStatus: GateStatus = filing?.approved_at
    ? "passed"
    : filing?.reviewer_notes
      ? "blocked"
      : "pending";

  return [
    { label: "Draft generated", status: draftPending ? "pending" : "passed" },
    { label: "CA / CS review", status: reviewStatus, timestamp: filing?.approved_at ?? null },
    { label: "Filed with SECP", status: filing?.filed_at ? "passed" : "pending", timestamp: filing?.filed_at ?? null },
  ];
}
