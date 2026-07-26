"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

/**
 * Magic-link-only auth for V1 — no password reset flow to build/maintain.
 * Revisit if customers specifically ask for password login.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(600px circle at 50% -10%, var(--color-primary) 0%, transparent 60%)",
          opacity: 0.08,
        }}
      />

      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in with a magic link — no password to remember.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-elevation-md">
          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-bg text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Check your inbox</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Email address" htmlFor="email">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </Field>
              <Button type="submit" disabled={status === "sending"} className="w-full">
                {status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link…
                  </>
                ) : (
                  "Send magic link"
                )}
              </Button>
              {status === "error" && (
                <p className="text-center text-sm text-danger">Something went wrong — try again.</p>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
