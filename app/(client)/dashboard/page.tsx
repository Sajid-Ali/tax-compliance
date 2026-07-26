import Link from "next/link";
import { Building2, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Company, FilingDeadline } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("*, filing_deadlines(*)")
    .order("created_at", { ascending: false });

  const rows = (companies ?? []) as Array<Company & { filing_deadlines: FilingDeadline[] }>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Your companies"
        description="Track SECP Form A deadlines across every company you own."
        action={
          <Link href="/companies/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            Add company
          </Link>
        }
      />

      {rows.length === 0 ? (
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
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((company) => {
            const nextDeadline = company.filing_deadlines
              .filter((d) => d.status !== "filed")
              .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

            return (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 shadow-elevation-sm transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SECP #{company.secp_registration_no}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {nextDeadline ? (
                      <>
                        <p className="text-sm font-medium text-foreground">
                          Form A due {nextDeadline.due_date}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <StatusBadge status={nextDeadline.status} />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-warning">Add an AGM date</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
