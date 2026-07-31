"use client";

import { useFormStatus } from "react-dom";
import { Button, type Variant } from "@/components/ui/button";

/**
 * Submit button for a React 19 server-action <form>. Must render inside that
 * form — useFormStatus reads the nearest parent form's pending state, however
 * submission was triggered (native click or a ConfirmSubmitButton's
 * requestSubmit), so a double-click can't fire the action twice.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant,
  size,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: React.ReactNode;
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} loading={pending}>
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
