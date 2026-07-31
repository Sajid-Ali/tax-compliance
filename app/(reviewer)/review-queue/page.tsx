import { createClient } from "@/lib/supabase/server";
import type { Company, Filing, FilingDeadline } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewQueueTable } from "@/components/tables/review-queue-table";

type Row = FilingDeadline & {
  companies: Pick<Company, "name" | "secp_registration_no">;
  // `filings.filing_deadline_id` is UNIQUE, so PostgREST embeds it as a
  // single nullable object, not an array.
  filings: Filing | null;
};

export default async function ReviewQueuePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("filing_deadlines")
    .select("*, companies(name, secp_registration_no), filings(*)")
    .eq("status", "in_review")
    .order("due_date", { ascending: true });

  const rows = (data ?? []) as Row[];

  const rowsWithUrls = await Promise.all(
    rows.map(async (row) => {
      const draftPath = row.filings?.draft_document_url;
      if (!draftPath) return { row, url: null };
      const { data: signed } = await supabase.storage
        .from("filings")
        .createSignedUrl(draftPath, 600);
      return { row, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pending your review"
        description="Approve or send back drafts before they're filed."
      />
      <ReviewQueueTable rowsWithUrls={rowsWithUrls} />
    </div>
  );
}
