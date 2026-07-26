import { CheckCircle2, Circle, FileEdit, Send, ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { FilingStatus } from "@/lib/types";

type Tone = "neutral" | "info" | "warning" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-secondary text-muted-foreground border-border",
  info: "bg-info-bg text-info border-info-border",
  warning: "bg-warning-bg text-warning border-warning-border",
  success: "bg-success-bg text-success border-success-border",
  danger: "bg-danger-bg text-danger border-danger-border",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_CONFIG: Record<FilingStatus, { label: string; tone: Tone; icon: React.ComponentType<{ className?: string }> }> = {
  upcoming: { label: "Upcoming", tone: "neutral", icon: Circle },
  reminder_sent: { label: "Reminder sent", tone: "info", icon: Clock },
  draft_ready: { label: "Draft ready", tone: "warning", icon: FileEdit },
  in_review: { label: "With your CA", tone: "info", icon: Send },
  approved: { label: "Approved — filing soon", tone: "success", icon: ShieldCheck },
  filed: { label: "Filed", tone: "success", icon: CheckCircle2 },
  overdue: { label: "Overdue", tone: "danger", icon: AlertTriangle },
};

export function StatusBadge({ status, className }: { status: FilingStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge tone={config.tone} className={className}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
