import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  // Gradient fill + colored glow — the primary action is the one place per
  // screen that's allowed to be loud; everything else stays quiet by
  // comparison so this keeps reading as an accent, not noise.
  primary:
    "bg-[linear-gradient(135deg,var(--color-primary-btn-from)_0%,var(--color-primary-btn-to)_100%)] text-primary-foreground shadow-elevation-glow hover:brightness-110 hover:-translate-y-px",
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
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[background-color,color,transform,box-shadow,filter] duration-150 ease-snap cursor-pointer active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
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
