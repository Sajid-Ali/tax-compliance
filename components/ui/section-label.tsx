import { type LucideIcon } from "lucide-react";

/**
 * Section header used inside cards — an icon tile + label, matching the
 * dashboard summary tiles' structured-system language rather than a soft
 * pill badge (which read more "casual notebook" than "enterprise ledger").
 */
export function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">{label}</span>
    </div>
  );
}
