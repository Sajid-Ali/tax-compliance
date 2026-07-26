import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type TimelineState = "done" | "current" | "upcoming" | "danger";

const circleClasses: Record<TimelineState, string> = {
  done: "bg-primary border-primary text-primary-foreground",
  current: "bg-surface border-primary text-primary",
  upcoming: "bg-surface border-border text-muted-foreground",
  danger: "bg-surface border-danger text-danger",
};

/**
 * Connected-circle vertical stepper — matches the reference design's
 * "To-do List" compliance panel. Each item renders a marker (checked /
 * highlighted / empty) linked to the next by a vertical line; the line is
 * built with flexbox (marker column: circle + flex-1 line segment) rather
 * than absolute positioning, so it adapts to variable content height.
 */
export function Timeline({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

export function TimelineItem({
  state,
  title,
  subtitle,
  meta,
  isLast = false,
}: {
  state: TimelineState;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
            circleClasses[state]
          )}
        >
          {state === "done" && <Check className="h-3.5 w-3.5" />}
        </span>
        {!isLast && <span className="my-1 w-0.5 flex-1 bg-border" />}
      </div>
      <div className={cn("flex flex-col gap-0.5", isLast ? "pb-0" : "pb-6")}>
        {meta && <p className="text-xs font-medium text-muted-foreground">{meta}</p>}
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
