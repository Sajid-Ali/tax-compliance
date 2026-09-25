import { describe, it, expect } from "vitest";
import { computeReviewQueueStats } from "../review-queue-stats";

const today = new Date("2026-09-25T12:00:00Z");

describe("computeReviewQueueStats", () => {
  it("returns all-zero stats for an empty queue", () => {
    expect(computeReviewQueueStats([], today)).toEqual({
      pendingCount: 0,
      approvedTodayCount: 0,
      changesRequestedCount: 0,
    });
  });

  it("counts in_review rows as pending", () => {
    const rows = [
      { status: "in_review" as const, approved_at: null, reviewer_notes: null },
      { status: "in_review" as const, approved_at: null, reviewer_notes: null },
      { status: "approved" as const, approved_at: "2026-09-25T09:00:00Z", reviewer_notes: null },
    ];
    expect(computeReviewQueueStats(rows, today).pendingCount).toBe(2);
  });

  it("counts rows approved today, excluding rows approved on other days", () => {
    const rows = [
      { status: "approved" as const, approved_at: "2026-09-25T09:00:00Z", reviewer_notes: null },
      { status: "approved" as const, approved_at: "2026-09-24T09:00:00Z", reviewer_notes: null },
    ];
    expect(computeReviewQueueStats(rows, today).approvedTodayCount).toBe(1);
  });

  it("counts draft_ready rows with reviewer notes as changes requested", () => {
    const rows = [
      { status: "draft_ready" as const, approved_at: null, reviewer_notes: "Fix NTN" },
      { status: "draft_ready" as const, approved_at: null, reviewer_notes: null },
    ];
    expect(computeReviewQueueStats(rows, today).changesRequestedCount).toBe(1);
  });
});
