"use client";

import { useMemo } from "react";
import { Building2, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Company, FilingDeadline } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

type CompanyRow = Company & { filing_deadlines: FilingDeadline[] };

function nextDeadlineOf(row: CompanyRow) {
  return row.filing_deadlines
    .filter((d) => d.status !== "filed")
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
}

export function CompaniesTable({ companies }: { companies: CompanyRow[] }) {
  const columns = useMemo<ColumnDef<CompanyRow>[]>(
    () => [
      {
        id: "name",
        header: "Company",
        accessorFn: (row) => row.name,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted-foreground">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">
                SECP #{row.original.secp_registration_no}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "next_deadline",
        header: "Next deadline",
        accessorFn: (row) => nextDeadlineOf(row)?.due_date ?? "",
        cell: ({ row }) => {
          const deadline = nextDeadlineOf(row.original);
          if (!deadline) {
            return <span className="text-sm font-medium text-warning">Add an AGM date</span>;
          }
          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground">Form A due {deadline.due_date}</span>
              <StatusBadge status={deadline.status} className="w-fit" />
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={companies}
      searchPlaceholder="Search companies…"
      getRowHref={(row) => `/companies/${row.id}`}
      emptyState={
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add one to start tracking its SECP Form A deadline — we'll compute the exact due date and remind you before it's close."
          action={
            <Link href="/companies/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="h-4 w-4" />
              Add your first company
            </Link>
          }
        />
      }
    />
  );
}
