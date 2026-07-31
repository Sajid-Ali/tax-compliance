"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateName } from "@/app/profile/actions";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function NameForm({ defaultName }: { defaultName: string }) {
  const [state, formAction] = useActionState(updateName, null);

  useEffect(() => {
    if (!state) return;
    if (state.success && state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
      <Field
        label="Full name"
        htmlFor="full_name"
        error={state?.fieldErrors?.full_name}
        className="flex-1"
      >
        <Input
          id="full_name"
          name="full_name"
          required
          defaultValue={defaultName}
          aria-invalid={!!state?.fieldErrors?.full_name}
        />
      </Field>
      <SubmitButton variant="outline" pendingLabel="Saving…">
        Save
      </SubmitButton>
    </form>
  );
}
