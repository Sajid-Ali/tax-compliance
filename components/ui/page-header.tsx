export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-4xl font-extrabold tracking-tighter text-balance text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && <p className="text-base text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
