import { cn } from "@/lib/cn";

export function Logo({ className, size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const dims = size === "lg" ? 44 : 28;
  const text = size === "lg" ? "text-xl font-bold tracking-tight" : "text-sm font-semibold tracking-tight";
  const tagline = size === "lg" ? "text-[11px]" : "text-[9px]";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width={dims} height={dims} viewBox="0 0 56 56" fill="none" aria-hidden>
        <rect width="56" height="56" rx="12" className="fill-primary" />
        <path
          d="M28 12L40 18V30C40 37.5 35 42 28 44C21 42 16 37.5 16 30V18L28 12Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23 28L27 32L34 24"
          className="stroke-primary-foreground"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={cn(text, "text-foreground")}>
          Sarmaya<span className="text-primary">Compliance</span>
        </span>
        {size === "lg" && (
          <span className={cn(tagline, "mt-1 tracking-wide text-muted-foreground uppercase")}>
            SECP &amp; FBR Annual Automation
          </span>
        )}
      </div>
    </div>
  );
}
