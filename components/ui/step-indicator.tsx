import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { getStepState } from "@/lib/step-state";

export function StepIndicator({
  steps,
  currentIndex,
  className,
}: {
  steps: string[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const state = getStepState(i, currentIndex);
        const isLast = i === steps.length - 1;
        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "completed" && "bg-primary text-primary-foreground",
                  state === "in-progress" && "border-2 border-primary text-primary",
                  state === "pending" && "border border-dashed border-border text-muted-foreground"
                )}
              >
                {state === "completed" ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium",
                  state === "pending" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 h-px flex-1",
                  state === "completed" ? "bg-primary" : "border-t border-dashed border-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
