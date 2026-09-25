import { describe, it, expect } from "vitest";
import { deriveFilingGates } from "../gates";

describe("deriveFilingGates", () => {
  it("shows all gates pending before a draft exists", () => {
    const gates = deriveFilingGates(null, "upcoming");
    expect(gates.map((g) => g.status)).toEqual(["pending", "pending", "pending"]);
  });

  it("marks the draft gate passed once a draft is ready, review still pending", () => {
    const gates = deriveFilingGates(null, "draft_ready");
    expect(gates[0].status).toBe("passed");
    expect(gates[1].status).toBe("pending");
  });

  it("marks the review gate blocked when the reviewer left notes without approving", () => {
    const gates = deriveFilingGates(
      { reviewer_notes: "NTN mismatch, please correct", approved_at: null, filed_at: null },
      "draft_ready"
    );
    expect(gates[1].status).toBe("blocked");
  });

  it("marks the review gate passed once approved, carrying the approval timestamp", () => {
    const gates = deriveFilingGates(
      { reviewer_notes: null, approved_at: "2026-09-01T10:00:00Z", filed_at: null },
      "approved"
    );
    expect(gates[1].status).toBe("passed");
    expect(gates[1].timestamp).toBe("2026-09-01T10:00:00Z");
  });

  it("marks the filed gate passed once filed_at is set", () => {
    const gates = deriveFilingGates(
      { reviewer_notes: null, approved_at: "2026-09-01T10:00:00Z", filed_at: "2026-09-02T09:00:00Z" },
      "filed"
    );
    expect(gates[2].status).toBe("passed");
    expect(gates[2].timestamp).toBe("2026-09-02T09:00:00Z");
  });
});
