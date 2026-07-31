"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import type { AgmRecord } from "@/lib/types";
import { deleteAgmRecord, updateAgmRecord } from "@/app/(client)/companies/actions";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit";
import { AgmForm } from "@/components/forms/agm-form";

function AgmRowActions({ companyId, record }: { companyId: string; record: AgmRecord }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex justify-end gap-1">
      <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit AGM record</DialogTitle>
            <DialogDescription>
              Changing the date recalculates this company&apos;s filing deadlines.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <AgmForm
              action={updateAgmRecord.bind(null, companyId, record.id)}
              defaultValues={record}
              submitLabel="Save changes"
              onSuccess={() => setEditOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <form action={deleteAgmRecord.bind(null, companyId, record.id)}>
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          dialogVariant="danger"
          title="Remove this AGM record?"
          description="Filing deadlines will be recalculated from the next most recent AGM record, if any. This can't be undone."
          confirmLabel="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}

export function AgmTable({ companyId, records }: { companyId: string; records: AgmRecord[] }) {
  const columns = useMemo<ColumnDef<AgmRecord>[]>(
    () => [
      { id: "agm_date", header: "AGM date", accessorKey: "agm_date" },
      {
        id: "financial_year_end",
        header: "Financial year end",
        accessorFn: (row) => row.financial_year_end ?? "—",
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <AgmRowActions companyId={companyId} record={row.original} />,
      },
    ],
    [companyId]
  );

  if (records.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No AGM recorded yet"
        description="Record one below to compute the Form A due date."
      />
    );
  }

  return <DataTable columns={columns} data={records} />;
}
