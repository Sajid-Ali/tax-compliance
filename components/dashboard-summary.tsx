import { Building2, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import type { FilingDeadline } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Summary strip shown above the company list — the "value immediately after
 * login" surface called for in the reference design's gradient hero card,
 * built from real aggregate counts rather than a decorative header.
 */
export function DashboardSummary({
  companies,
  deadlines,
}: {
  companies: number;
  deadlines: FilingDeadline[];
}) {
  const overdue = deadlines.filter((d) => d.status === "overdue").length;
  const inProgress = deadlines.filter((d) =>
    ["draft_ready", "in_review", "approved"].includes(d.status)
  ).length;
  const upcoming = deadlines.filter((d) =>
    ["upcoming", "reminder_sent"].includes(d.status)
  ).length;
  const filed = deadlines.filter((d) => d.status === "filed").length;

  const tiles = [
    { label: "Companies tracked", value: companies, icon: Building2, tone: "neutral" as const },
    { label: "Upcoming", value: upcoming, icon: Clock, tone: "info" as const },
    { label: "In progress", value: inProgress, icon: CheckCircle2, tone: "warning" as const },
    { label: "Overdue", value: overdue, icon: AlertTriangle, tone: "danger" as const },
  ];

  const toneClasses = {
    neutral: "text-muted-foreground bg-surface-secondary",
    info: "text-info bg-info-bg",
    warning: "text-warning bg-warning-bg",
    danger: "text-danger bg-danger-bg",
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={cn(
            "flex flex-col gap-3 rounded-xl border bg-surface p-4 shadow-elevation-sm",
            tile.tone === "danger" && overdue > 0 ? "border-danger-border" : "border-border"
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              toneClasses[tile.tone]
            )}
          >
            <tile.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {tile.value}
            </p>
            <p className="text-xs text-muted-foreground">{tile.label}</p>
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
