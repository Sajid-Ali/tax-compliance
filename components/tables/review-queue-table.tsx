"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FileCheck2, FileX2 } from "lucide-react";
import type { Company, Filing, FilingDeadline } from "@/lib/types";
import { approveFiling, requestChanges } from "@/app/(reviewer)/review-queue/actions";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit";
import { PdfPreviewDialog } from "@/components/ui/pdf-preview-dialog";

type Row = FilingDeadline & {
  companies: Pick<Company, "name" | "secp_registration_no">;
  filings: Filing | null;
};

function RequestChangesForm({ deadlineId }: { deadlineId: string }) {
  const [notes, setNotes] = useState("");
  return (
    <form
      action={requestChanges.bind(null, deadlineId)}
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Input
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What needs to change?"
        className="h-8 w-48 text-sm"
      />
      <SubmitButton variant="outline" size="sm" pendingLabel="Sending…">
        <FileX2 className="h-3.5 w-3.5" />
        Request changes
      </SubmitButton>
    </form>
  );
}

export function ReviewQueueTable({ rowsWithUrls }: { rowsWithUrls: { row: Row; url: string | null }[] }) {
  const columns = useMemo<ColumnDef<{ row: Row; url: string | null }>[]>(
    () => [
      {
        id: "company",
        header: "Company",
        accessorFn: (r) => r.row.companies.name,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.row.companies.name}</p>
            <p className="text-xs text-muted-foreground">
              SECP #{row.original.row.companies.secp_registration_no} · Due{" "}
              {row.original.row.due_date}
            </p>
          </div>
        ),
      },
      {
        id: "draft",
        header: "Draft",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.url ? (
            <PdfPreviewDialog
              url={row.original.url}
              title={`${row.original.row.companies.name} — Form A draft`}
              description="Internal CA review sheet — not the official SECP form."
            />
          ) : (
            <span className="text-sm text-danger">No draft file found</span>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-wrap items-center justify-end gap-2"
          >
            <form action={approveFiling.bind(null, row.original.row.id)}>
              <ConfirmSubmitButton
                size="sm"
                title="Approve this filing?"
                description="This signals to the admin that the draft is ready to be filed with SECP. You can still request changes later if something's off."
                confirmLabel="Approve"
              >
                Approve
              </ConfirmSubmitButton>
            </form>
            <RequestChangesForm deadlineId={row.original.row.id} />
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
        <EmptyState icon={FileCheck2} title="Nothing to review" description="You're all caught up." />
      }
    />
  );
}
