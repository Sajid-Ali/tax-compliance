import { type LucideIcon } from "lucide-react";

/**
 * Icon + label pill used as a section header — matches the "Summary" /
 * "To-do List" / "AI Compliance Assistant" treatment in the reference
 * design, rather than a plain text heading.
 */
export function PillHeader({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-pill-bg px-3 py-1.5 text-sm font-medium text-pill-fg">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}
