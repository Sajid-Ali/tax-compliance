"use client";

import { Toaster as SonnerToaster } from "sonner";

/** Themed to the app's own tokens rather than sonner's defaults. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg! border! border-border! bg-surface! text-foreground! shadow-elevation-lg!",
          title: "text-sm! font-medium!",
          description: "text-muted-foreground!",
          success: "border-success-border! bg-success-bg! text-success!",
          error: "border-danger-border! bg-danger-bg! text-danger!",
          actionButton: "bg-primary! text-primary-foreground!",
          cancelButton: "bg-surface-secondary! text-foreground!",
        },
      }}
    />
  );
}
