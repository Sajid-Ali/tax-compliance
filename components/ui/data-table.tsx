"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Placeholder for the built-in global search box; omit to hide search entirely. */
  searchPlaceholder?: string;
  /** Rendered instead of the table when `data` is empty — pass the existing EmptyState. */
  emptyState?: React.ReactNode;
  /** When provided, clicking a row navigates here (keyboard-accessible via Enter on the focused row). */
  getRowHref?: (row: TData) => string | undefined;
  pageSize?: number;
}

/**
 * Sortable, searchable, paginated, keyboard-accessible table — replaces the
 * stacked "card row" lists used across the dashboard, filing queue, review
 * queue, and directors list.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
  emptyState,
  getRowHref,
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col gap-3">
      {searchPlaceholder && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-8 text-sm"
            aria-label="Search"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-elevation-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border-subtle">
                {headerGroup.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sortState = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortState === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : sortState === "desc" ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No results match your search.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const href = getRowHref?.(row.original);
                return (
                  <tr
                    key={row.id}
                    tabIndex={href ? 0 : undefined}
                    role={href ? "link" : undefined}
                    onClick={href ? () => router.push(href) : undefined}
                    onKeyDown={
                      href
                        ? (e) => {
                            if (e.key === "Enter") router.push(href);
                          }
                        : undefined
                    }
                    className={cn(
                      "border-b border-border-subtle last:border-0 transition-colors",
                      href &&
                        "cursor-pointer hover:bg-surface-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle text-foreground">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
