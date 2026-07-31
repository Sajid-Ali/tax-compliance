"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createCompany } from "@/app/(client)/companies/actions";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function AddCompanyForm() {
  const [state, formAction] = useActionState(createCompany, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Company name" htmlFor="name" error={state?.fieldErrors?.name}>
        <Input
          id="name"
          name="name"
          required
          placeholder="Acme Pvt Ltd"
          aria-invalid={!!state?.fieldErrors?.name}
        />
      </Field>
      <Field
        label="SECP registration number"
        htmlFor="secp_registration_no"
        error={state?.fieldErrors?.secp_registration_no}
      >
        <Input
          id="secp_registration_no"
          name="secp_registration_no"
          required
          placeholder="0123456"
          aria-invalid={!!state?.fieldErrors?.secp_registration_no}
        />
      </Field>
      <Field
        label="Incorporation date"
        htmlFor="incorporation_date"
        error={state?.fieldErrors?.incorporation_date}
      >
        <Input
          id="incorporation_date"
          type="date"
          name="incorporation_date"
          required
          aria-invalid={!!state?.fieldErrors?.incorporation_date}
        />
      </Field>
      <Field
        label="Paid-up capital (PKR)"
        htmlFor="paid_up_capital"
        hint="Under PKR 1,000,000 means no mandatory auditor yet."
        error={state?.fieldErrors?.paid_up_capital}
      >
        <Input
          id="paid_up_capital"
          type="number"
          name="paid_up_capital"
          min={0}
          defaultValue={0}
          aria-invalid={!!state?.fieldErrors?.paid_up_capital}
        />
      </Field>
      <SubmitButton className="mt-2 self-start" pendingLabel="Adding…">
        Add company
      </SubmitButton>
    </form>
  );
}
