"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Inbox } from "lucide-react";
import type { Company, FilingDeadline } from "@/lib/types";
import { effectiveStatus } from "@/lib/rules-engine";
import { generateDraft, markFiled, sendToReviewer } from "@/app/admin/filing-queue/actions";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { PdfPreviewDialog } from "@/components/ui/pdf-preview-dialog";

type Row = FilingDeadline & { companies: Pick<Company, "name" | "secp_registration_no"> };
type RowWithUrl = { row: Row; draftUrl: string | null };

function ActionsCell({ row, draftUrl }: { row: Row; draftUrl: string | null }) {
  if (row.status === "upcoming" || row.status === "reminder_sent" || row.status === "overdue") {
    return (
      <form action={generateDraft.bind(null, row.id)}>
        <SubmitButton variant="outline" size="sm" pendingLabel="Generating…">
          Generate draft
        </SubmitButton>
      </form>
    );
  }
  if (row.status === "draft_ready") {
    return (
      <div className="flex items-center gap-2">
        {draftUrl && (
          <PdfPreviewDialog
            url={draftUrl}
            title={`${row.companies.name} — Form A draft`}
            triggerLabel="View draft"
          />
        )}
        <form action={sendToReviewer.bind(null, row.id)}>
          <SubmitButton variant="outline" size="sm" pendingLabel="Sending…">
            Send to CA reviewer
          </SubmitButton>
        </form>
      </div>
    );
  }
  if (row.status === "in_review") {
    return (
      <div className="flex items-center gap-2">
        {draftUrl && (
          <PdfPreviewDialog
            url={draftUrl}
            title={`${row.companies.name} — Form A draft`}
            triggerLabel="View draft"
          />
        )}
        <span className="rounded-md bg-warning-bg px-3 py-1.5 text-sm text-warning">
          Waiting on CA review
        </span>
      </div>
    );
  }
  if (row.status === "approved") {
    return (
      <div className="flex flex-col items-end gap-2">
        {draftUrl && (
          <PdfPreviewDialog
            url={draftUrl}
            title={`${row.companies.name} — Form A draft`}
            triggerLabel="View draft"
          />
        )}
        <form
          action={markFiled.bind(null, row.id)}
          className="flex flex-col items-end gap-2 sm:flex-row sm:items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <FileDropzone name="receipt" accept="application/pdf,image/*" className="w-44" />
          <ConfirmSubmitButton
            size="sm"
            title="Mark this filing as filed?"
            description="This records the filing as complete with SECP and moves it out of the queue. It can't be undone from here — if you need to reopen it, that has to be done directly in the database."
            confirmLabel="Mark filed"
          >
            Mark filed
          </ConfirmSubmitButton>
        </form>
      </div>
    );
  }
  return null;
}

export function FilingQueueTable({ rowsWithUrls }: { rowsWithUrls: RowWithUrl[] }) {
  const columns = useMemo<ColumnDef<RowWithUrl>[]>(
    () => [
      {
        id: "company",
        header: "Company",
        accessorFn: (r) => r.row.companies.name,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.row.companies.name}</p>
            <p className="text-xs text-muted-foreground">
              SECP #{row.original.row.companies.secp_registration_no}
            </p>
          </div>
        ),
      },
      {
        id: "due_date",
        header: "Due date",
        accessorFn: (r) => r.row.due_date,
        cell: ({ row }) => <span className="tabular-nums">{row.original.row.due_date}</span>,
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (r) => effectiveStatus(r.row.status, r.row.due_date),
        cell: ({ row }) => (
          <StatusBadge
            status={effectiveStatus(row.original.row.status, row.original.row.due_date)}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
            <ActionsCell row={row.original.row} draftUrl={row.original.draftUrl} />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={rowsWithUrls}
      searchPlaceholder="Search by company…"
      emptyState={
        <EmptyState
          icon={Inbox}
          title="All caught up"
          description="Nothing pending — everything is filed or upcoming."
        />
      }
    />
  );
}
