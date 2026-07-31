"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markPasswordSet } from "@/app/set-password/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * `hasPassword` gates whether "current password" is required — best-effort
 * from the server (see app/profile/page.tsx), defaulting to false (skip the
 * check) if migration 0005_password_login.sql hasn't landed yet, so this
 * never blocks someone from setting a password for the first time.
 */
export function ChangePasswordForm({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setPending(true);
    const supabase = createClient();

    if (hasPassword) {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyErr) {
        toast.error("Current password is incorrect.");
        setPending(false);
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      setPending(false);
      return;
    }

    await markPasswordSet();
    toast.success(
      hasPassword ? "Password updated." : "Password set — you can sign in with it next time."
    );
    setCurrentPassword("");
    setPassword("");
    setConfirm("");
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {hasPassword && (
        <Field label="Current password" htmlFor="current_password">
          <Input
            id="current_password"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
      )}
      <Field label="New password" htmlFor="new_password">
        <Input
          id="new_password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm_password">
        <Input
          id="confirm_password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      <Button type="submit" variant="outline" disabled={pending} className="self-start">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {hasPassword ? "Update password" : "Set password"}
      </Button>
    </form>
  );
}
