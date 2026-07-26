import { type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface-secondary/50 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
