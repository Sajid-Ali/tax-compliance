"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, type Variant } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Gates a server-action <form> submission behind a confirm dialog. Must be
 * rendered inside the <form> it guards: it's a type="button" (never submits
 * directly), and on confirm calls the native `.form.requestSubmit(this)` —
 * so no ref needs threading down to the <form> element itself.
 */
export function ConfirmSubmitButton({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  dialogVariant = "primary",
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style of the confirm button inside the dialog — defaults to matching `variant`. */
  dialogVariant?: Variant;
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        variant={variant}
        size={size}
        className={className}
        loading={pending}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={dialogVariant ?? variant}
        onConfirm={() => {
          setOpen(false);
          buttonRef.current?.form?.requestSubmit(buttonRef.current);
        }}
      />
    </>
  );
}
