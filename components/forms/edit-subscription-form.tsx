"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { formatISO } from "date-fns";
import type { Subscription } from "@/lib/types";
import { markInvoiced, markPaid, updateSubscription } from "@/app/admin/billing/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

function formatDate(iso: string | null) {
  if (!iso) return "never";
  return formatISO(new Date(iso), { representation: "date" });
}

export function EditSubscriptionForm({ subscription }: { subscription: Subscription }) {
  const [state, formAction] = useActionState(
    updateSubscription.bind(null, subscription.company_id),
    null
  );

  useEffect(() => {
    if (!state) return;
    if (state.success && state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Status" htmlFor={`status_${subscription.id}`} className="sm:w-40">
          <Select id={`status_${subscription.id}`} name="status" defaultValue={subscription.status}>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>
        <Field
          label="Monthly amount (PKR)"
          htmlFor={`amount_${subscription.id}`}
          className="sm:w-40"
          error={state?.fieldErrors?.monthly_amount_pkr}
        >
          <Input
            id={`amount_${subscription.id}`}
            type="number"
            name="monthly_amount_pkr"
            min={0}
            defaultValue={subscription.monthly_amount_pkr}
          />
        </Field>
        <Field label="Notes" htmlFor={`notes_${subscription.id}`} className="flex-1">
          <Textarea
            id={`notes_${subscription.id}`}
            name="notes"
            rows={1}
            defaultValue={subscription.notes ?? ""}
          />
        </Field>
        <SubmitButton variant="outline" size="sm" pendingLabel="Saving…">
          Save
        </SubmitButton>
      </form>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Last invoiced: {formatDate(subscription.last_invoiced_at)}</span>
        <span>Last paid: {formatDate(subscription.last_paid_at)}</span>
        <form action={markInvoiced.bind(null, subscription.company_id)}>
          <SubmitButton variant="outline" size="sm" pendingLabel="Marking…">
            Mark invoiced
          </SubmitButton>
        </form>
        <form action={markPaid.bind(null, subscription.company_id)}>
          <SubmitButton variant="outline" size="sm" pendingLabel="Marking…">
            Mark paid
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
