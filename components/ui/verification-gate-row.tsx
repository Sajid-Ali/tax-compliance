import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { GateInfo } from "@/lib/gates";

export function VerificationGateRow({ gate, className }: { gate: GateInfo; className?: string }) {
  const Icon = gate.status === "passed" ? CheckCircle2 : gate.status === "blocked" ? AlertTriangle : Circle;
  const iconClass =
    gate.status === "passed" ? "text-success" : gate.status === "blocked" ? "text-danger" : "text-muted-foreground";

  return (
    <div className={cn("flex items-center justify-between gap-3 py-2", className)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", iconClass)} />
        <span className="text-sm font-medium text-foreground">{gate.label}</span>
      </div>
      {gate.timestamp && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {new Date(gate.timestamp).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
