import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({ className, size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const badge = size === "lg" ? "h-11 w-11 rounded-2xl" : "h-7 w-7 rounded-md";
  const icon = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  const text = size === "lg" ? "text-xl font-bold tracking-tight" : "text-sm font-semibold tracking-tight";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-glow)_100%)] text-primary-foreground shadow-elevation-glow",
          badge
        )}
      >
        <ShieldCheck className={icon} />
      </span>
      <span className={cn(text, "text-foreground")}>Compliance Reminders</span>
    </div>
  );
}
