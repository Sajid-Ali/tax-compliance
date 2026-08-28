"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markPasswordSet } from "./actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setError(updateErr.message);
      setStatus("idle");
      return;
    }

    await markPasswordSet();
    router.push(next);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute left-[62%] top-[8%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary-glow/20 blur-[110px]" />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-7 text-center">
          <Logo size="lg" />
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tighter text-foreground">
              Set a password
            </h1>
            <p className="text-sm text-muted-foreground">
              You&apos;re in — set a password so next time you can sign in with your email instead
              of waiting on a link.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-surface p-6 shadow-elevation-lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="New password" htmlFor="password">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Confirm password" htmlFor="confirm">
              <Input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={status === "saving"} className="w-full">
              {status === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Set password"
              )}
            </Button>
            <button
              type="button"
              onClick={() => router.push(next)}
              className="cursor-pointer text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}
