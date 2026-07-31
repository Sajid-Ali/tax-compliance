import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Company, FilingDeadline } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { CompaniesTable } from "@/components/tables/companies-table";
import { DashboardSummary } from "@/components/dashboard-summary";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("*, filing_deadlines(*)")
    .order("created_at", { ascending: false });

  const rows = (companies ?? []) as Array<Company & { filing_deadlines: FilingDeadline[] }>;
  const allDeadlines = rows.flatMap((c) => c.filing_deadlines);

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

      {rows.length > 0 && <DashboardSummary companies={rows.length} deadlines={allDeadlines} />}

      <CompaniesTable companies={rows} />
    </div>
  );
}
