"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, UserRound } from "lucide-react";
import type { CompanyDirector } from "@/lib/types";
import { deleteDirector, updateDirector } from "@/app/(client)/companies/actions";
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
import { DirectorForm } from "@/components/forms/director-form";

function DirectorRowActions({
  companyId,
  director,
}: {
  companyId: string;
  director: CompanyDirector;
}) {
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
            <DialogTitle>Edit director</DialogTitle>
            <DialogDescription>
              Updates apply immediately — no draft is regenerated.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <DirectorForm
              action={updateDirector.bind(null, companyId, director.id)}
              defaultValues={director}
              submitLabel="Save changes"
              onSuccess={() => setEditOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <form action={deleteDirector.bind(null, companyId, director.id)}>
        <ConfirmSubmitButton
          variant="ghost"
          size="sm"
          dialogVariant="danger"
          title={`Remove ${director.name}?`}
          description="This removes the director from this company's records. It won't affect deadlines already computed, but future Form A drafts won't include them."
          confirmLabel="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}

export function DirectorsTable({
  companyId,
  directors,
}: {
  companyId: string;
  directors: CompanyDirector[];
}) {
  const columns = useMemo<ColumnDef<CompanyDirector>[]>(
    () => [
      { id: "name", header: "Name", accessorKey: "name" },
      { id: "cnic", header: "CNIC", accessorKey: "cnic" },
      { id: "designation", header: "Designation", accessorKey: "designation" },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <DirectorRowActions companyId={companyId} director={row.original} />,
      },
    ],
    [companyId]
  );

  if (directors.length === 0) {
    return <EmptyState icon={UserRound} title="No directors yet" description="Add one below." />;
  }

  return <DataTable columns={columns} data={directors} />;
}
