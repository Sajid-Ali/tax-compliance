import { Building2, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import type { FilingDeadline } from "@/lib/types";
import { effectiveStatus } from "@/lib/rules-engine";
import { cn } from "@/lib/cn";
import { AnimatedNumber } from "@/components/ui/animated-number";

/**
 * Summary strip shown above the company list — the "value immediately after
 * login" surface. The first tile carries a flat primary fill as the one
 * accent moment on this screen; the other three stay quieter by comparison
 * so the accent still reads as an accent.
 */
export function DashboardSummary({
  companies,
  deadlines,
}: {
  companies: number;
  deadlines: FilingDeadline[];
}) {
  const statuses = deadlines.map((d) => effectiveStatus(d.status, d.due_date));
  const overdue = statuses.filter((s) => s === "overdue").length;
  const inProgress = statuses.filter((s) =>
    ["draft_ready", "in_review", "approved"].includes(s)
  ).length;
  const upcoming = statuses.filter((s) => ["upcoming", "reminder_sent"].includes(s)).length;
  const filed = statuses.filter((s) => s === "filed").length;

  const tiles = [
    { label: "Companies tracked", value: companies, icon: Building2, tone: "hero" as const },
    { label: "Upcoming", value: upcoming, icon: Clock, tone: "info" as const },
    { label: "In progress", value: inProgress, icon: CheckCircle2, tone: "warning" as const },
    { label: "Overdue", value: overdue, icon: AlertTriangle, tone: "danger" as const },
  ];

  const badgeClasses = {
    hero: "bg-primary-foreground/15 text-primary-foreground",
    info: "bg-info-bg text-info",
    warning: "bg-warning-bg text-warning",
    danger: "bg-danger-bg text-danger",
  };

  const underlineClasses = {
    hero: "bg-primary-foreground/40",
    info: "bg-info",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {tiles.map((tile, i) => (
        <div
          key={tile.label}
          style={{ animationDelay: `${i * 70}ms` }}
          className={cn(
            "animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards flex flex-col gap-4 rounded-md p-5 duration-500 ease-out",
            "transition-[box-shadow,transform] duration-200 ease-snap hover:-translate-y-1",
            tile.tone === "hero"
              ? "bg-primary shadow-elevation-sm"
              : cn(
                  "border bg-surface",
                  tile.tone === "danger" && overdue > 0 ? "border-danger-border" : "border-border"
                )
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              badgeClasses[tile.tone]
            )}
          >
            <tile.icon className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p
              className={cn(
                "font-mono text-5xl font-extrabold tracking-tight tabular-nums",
                tile.tone === "hero" ? "text-primary-foreground" : "text-foreground"
              )}
            >
              <AnimatedNumber value={tile.value} />
            </p>
            <p
              className={cn(
                "text-xs font-medium",
                tile.tone === "hero" ? "text-primary-foreground/90" : "text-muted-foreground"
              )}
            >
              {tile.label}
            </p>
            <div className={cn("h-0.5 w-8 rounded-full", underlineClasses[tile.tone])} />
          </div>
        </div>
      ))}
      {filed > 0 && (
        <p className="col-span-2 self-center text-xs text-muted-foreground sm:col-span-4">
          {filed} filing{filed === 1 ? "" : "s"} filed to date.
        </p>
      )}
    </div>
  );
}
