import { cn } from "@/lib/cn";

function initialsFrom(name?: string | null, email?: string | null) {
  const source = name?.trim() || email || "?";
  const parts = source.split(/[\s@]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  email,
  size = "md",
  className,
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-20 w-20 text-2xl",
  }[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed/public storage URLs, not a local asset next/image can optimize
      <img
        src={src}
        alt={name ?? email ?? "Profile photo"}
        className={cn("shrink-0 rounded-full object-cover", sizeClasses, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        sizeClasses,
        className
      )}
      aria-hidden
    >
      {initialsFrom(name, email)}
    </div>
  );
}
