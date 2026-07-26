import { ShieldCheck } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Compliance Reminders
      </span>
    </div>
  );
}
