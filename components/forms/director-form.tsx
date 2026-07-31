"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function DirectorForm({
  action,
  defaultValues,
  submitLabel = "Add director",
  onSuccess,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { name: string; cnic: string; designation: string };
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      if (state.message) toast.success(state.message);
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <Field label="Name" htmlFor="name" error={state?.fieldErrors?.name}>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          aria-invalid={!!state?.fieldErrors?.name}
        />
      </Field>
      <Field label="CNIC" htmlFor="cnic" error={state?.fieldErrors?.cnic}>
        <Input
          id="cnic"
          name="cnic"
          required
          placeholder="42101-1234567-1"
          defaultValue={defaultValues?.cnic}
          aria-invalid={!!state?.fieldErrors?.cnic}
        />
      </Field>
      <Field label="Designation" htmlFor="designation" error={state?.fieldErrors?.designation}>
        <Input
          id="designation"
          name="designation"
          defaultValue={defaultValues?.designation ?? "Director"}
          aria-invalid={!!state?.fieldErrors?.designation}
        />
      </Field>
      <SubmitButton variant="outline" size="sm" className="self-start">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
