import { createClient } from "@/lib/supabase/server";
import type { Company, Filing, FilingDeadline } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { FilingQueueTable } from "@/components/tables/filing-queue-table";

type Row = FilingDeadline & {
  companies: Pick<Company, "name" | "secp_registration_no">;
  // `filings.filing_deadline_id` is UNIQUE, so PostgREST embeds it as a
  // single nullable object, not an array — indexing with [0] throws when
  // no filing exists yet (most rows here, since this excludes "filed").
  filings: Filing | null;
};

export default async function FilingQueuePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("filing_deadlines")
    .select("*, companies(name, secp_registration_no), filings(*)")
    .neq("status", "filed")
    .order("due_date", { ascending: true });

  const rows = (data ?? []) as Row[];

  const rowsWithUrls = await Promise.all(
    rows.map(async (row) => {
      const draftPath = row.filings?.draft_document_url;
      if (!draftPath) return { row, draftUrl: null };
      const { data: signed } = await supabase.storage
        .from("filings")
        .createSignedUrl(draftPath, 600);
      return { row, draftUrl: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Filing queue"
        description="Generate drafts, route them for review, and mark filings complete."
      />
      <FilingQueueTable rowsWithUrls={rowsWithUrls} />
    </div>
  );
}
