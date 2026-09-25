export type StepState = "completed" | "in-progress" | "pending";

/** Pure step-state derivation shared by StepIndicator and its callers. */
export function getStepState(stepIndex: number, currentIndex: number): StepState {
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "in-progress";
  return "pending";
}
