import { createClient } from "@/lib/supabase/server";
import type { Company, Subscription } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubscriptionStatusBadge } from "@/components/ui/badge";
import { EditSubscriptionForm } from "@/components/forms/edit-subscription-form";

type Row = Subscription & { companies: Pick<Company, "name" | "secp_registration_no"> };

export default async function BillingPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*, companies(name, secp_registration_no)")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as Row[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Billing"
        description="V1 billing is fully manual — invoice and mark paid here, no payment gateway yet. See README for why."
      />

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="flex flex-col gap-3 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{row.companies.name}</p>
                  <p className="text-xs text-muted-foreground">
                    SECP #{row.companies.secp_registration_no}
                  </p>
                </div>
                <SubscriptionStatusBadge status={row.status} />
              </div>
              <EditSubscriptionForm subscription={row} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
