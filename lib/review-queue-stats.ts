import { isSameDay, parseISO } from "date-fns";
import type { FilingStatus } from "./types";

export interface ReviewQueueStats {
  pendingCount: number;
  approvedTodayCount: number;
  changesRequestedCount: number;
}

/**
 * Real aggregate counts only — no invented metrics. `approvedTodayCount`
 * and `changesRequestedCount` require a broader query than the review-queue
 * page's own `status = in_review` filter (see Task 4.2 Step 4), since those
 * rows have already left that status by definition.
 */
export function computeReviewQueueStats(
  rows: Array<{ status: FilingStatus; approved_at: string | null; reviewer_notes: string | null }>,
  today: Date = new Date()
): ReviewQueueStats {
  return rows.reduce<ReviewQueueStats>(
    (acc, row) => {
      if (row.status === "in_review") acc.pendingCount += 1;
      if (row.approved_at && isSameDay(parseISO(row.approved_at), today)) acc.approvedTodayCount += 1;
      if (row.status === "draft_ready" && row.reviewer_notes) acc.changesRequestedCount += 1;
      return acc;
    },
    { pendingCount: 0, approvedTodayCount: 0, changesRequestedCount: 0 }
  );
}
