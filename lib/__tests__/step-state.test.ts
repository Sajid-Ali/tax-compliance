import { describe, it, expect } from "vitest";
import { getStepState } from "../step-state";

describe("getStepState", () => {
  it("marks steps before the current index as completed", () => {
    expect(getStepState(0, 2)).toBe("completed");
    expect(getStepState(1, 2)).toBe("completed");
  });

  it("marks the current index as in-progress", () => {
    expect(getStepState(2, 2)).toBe("in-progress");
  });

  it("marks steps after the current index as pending", () => {
    expect(getStepState(3, 2)).toBe("pending");
  });

  it("marks every step completed when currentIndex is past the last step", () => {
    expect(getStepState(3, 4)).toBe("completed");
  });
});
