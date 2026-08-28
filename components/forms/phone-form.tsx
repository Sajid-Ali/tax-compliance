"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updatePhone } from "@/app/profile/actions";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function PhoneForm({ defaultPhone }: { defaultPhone: string }) {
  const [state, formAction] = useActionState(updatePhone, null);

  useEffect(() => {
    if (!state) return;
    if (state.success && state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
      <Field
        label="Phone number"
        htmlFor="phone"
        hint="Include country code, e.g. +923001234567. Used for SMS deadline reminders — leave blank to skip SMS and get email only."
        error={state?.fieldErrors?.phone}
        className="flex-1"
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          aria-invalid={!!state?.fieldErrors?.phone}
        />
      </Field>
      <SubmitButton variant="outline" pendingLabel="Saving…">
        Save
      </SubmitButton>
    </form>
  );
}
