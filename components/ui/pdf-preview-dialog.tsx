"use client";

import { useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * "Preview" trigger + inline iframe viewer for a signed draft/receipt URL —
 * replaces opening the PDF in a new tab as the primary path (still offered
 * as a secondary action, since some browsers/PDF viewers behave better
 * standalone).
 */
export function PdfPreviewDialog({
  url,
  title,
  description,
  triggerLabel = "Preview",
}: {
  url: string;
  title: string;
  description?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <FileText className="h-3.5 w-3.5" />
        {triggerLabel}
      </Button>
      <DialogContent size="lg" className="flex h-[85vh] flex-col" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-lg border border-border-subtle">
          <iframe src={url} title={title} className="h-full w-full" />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline underline-offset-2"
        >
          Open in new tab
          <ExternalLink className="h-3 w-3" />
        </a>
      </DialogContent>
    </Dialog>
  );
}
