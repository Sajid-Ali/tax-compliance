import { FileCheck2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Company, Filing, FilingDeadline } from "@/lib/types";
import { approveFiling, requestChanges } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

type Row = FilingDeadline & {
  companies: Pick<Company, "name" | "secp_registration_no">;
  filings: Filing[];
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
      const draftPath = row.filings[0]?.draft_document_url;
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

      {rowsWithUrls.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="Nothing to review"
          description="You're all caught up."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {rowsWithUrls.map(({ row, url }) => (
            <Card key={row.id}>
              <CardContent className="flex flex-col gap-3 pt-5">
                <div>
                  <p className="font-medium text-foreground">{row.companies.name}</p>
                  <p className="text-sm text-muted-foreground">
                    SECP #{row.companies.secp_registration_no} · Form A due {row.due_date}
                  </p>
                </div>

                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-fit text-sm font-medium text-primary underline underline-offset-2"
                  >
                    View draft PDF
                  </a>
                ) : (
                  <p className="text-sm text-danger">No draft file found.</p>
                )}

                <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
                  <form action={approveFiling.bind(null, row.id)}>
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form
                    action={requestChanges.bind(null, row.id)}
                    className="flex items-center gap-2"
                  >
                    <Input name="notes" placeholder="What needs to change?" className="h-8 w-56" />
                    <Button type="submit" variant="outline" size="sm">
                      Request changes
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
