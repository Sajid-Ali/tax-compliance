"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Branded fallback for a route segment's error.tsx — replaces Next.js's
 * default unstyled error page. `reset` re-renders the segment in place
 * without a full navigation.
 */
export function ErrorState({
  error,
  reset,
  title = "Something went wrong",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-danger-border bg-danger-bg/40 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertOctagon className="h-5 w-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This page hit an unexpected error loading its data. Try again — if it keeps happening,
          the underlying issue has already been logged.
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={reset} className="mt-1">
        <RotateCw className="h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  );
}
