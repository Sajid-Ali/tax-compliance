import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  // Flat solid fill — Institutional Modernism has no gradient/glow
  // anywhere; the primary action reads as authoritative through color and
  // weight, not shine.
  primary:
    "bg-primary text-primary-foreground shadow-elevation-sm hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-surface-secondary text-foreground hover:bg-border border border-border",
  outline: "bg-surface text-foreground border border-border hover:bg-surface-secondary",
  ghost: "text-foreground hover:bg-surface-secondary",
  danger: "bg-danger text-white hover:opacity-90 shadow-elevation-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function buttonVariants(opts: { variant?: Variant; size?: Size; className?: string } = {}) {
  const { variant = "primary", size = "md", className } = opts;
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-150 ease-snap cursor-pointer",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button — for actions without native form-status pending (e.g. onClick handlers). */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, loading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
