"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type Mode = "magic-link" | "password";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function GoogleButton() {
  const [status, setStatus] = useState<"idle" | "redirecting">("idle");

  async function handleClick() {
    setStatus("redirecting");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "redirecting"}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary disabled:opacity-60"
    >
      {status === "redirecting" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      Continue with Google
    </button>
  );
}

function MagicLinkForm() {
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

  if (status === "sent") {
    return (
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
    );
  }

  return (
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
      <p className="text-center text-xs text-muted-foreground">
        First time signing in? A magic link is all you need — you can set a password afterwards.
      </p>
    </form>
  );
}

function PasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "signing-in">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("signing-in");
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setError("Incorrect email or password.");
      setStatus("idle");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Email address" htmlFor="password-email">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password-email"
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
      <Field label="Password" htmlFor="password">
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
          />
        </div>
      </Field>
      <Button type="submit" disabled={status === "signing-in"} className="w-full">
        {status === "signing-in" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
      <p className="text-center text-xs text-muted-foreground">
        Haven&apos;t set a password yet? Use a magic link instead.
      </p>
    </form>
  );
}

function LoginCard() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("magic-link");
  const authError = searchParams.get("error");

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-7 text-center">
          <Logo size="lg" />
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tighter text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to Sarmaya Compliance.</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-md border border-border bg-surface p-6">
          <GoogleButton />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div
            role="tablist"
            className="grid grid-cols-2 gap-1 rounded-md bg-surface-secondary p-1 text-sm"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "magic-link"}
              onClick={() => setMode("magic-link")}
              className={cn(
                "cursor-pointer rounded-[calc(var(--radius-md)-4px)] px-3 py-1.5 font-medium transition-colors",
                mode === "magic-link"
                  ? "bg-surface text-foreground shadow-elevation-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Magic link
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "password"}
              onClick={() => setMode("password")}
              className={cn(
                "cursor-pointer rounded-[calc(var(--radius-md)-4px)] px-3 py-1.5 font-medium transition-colors",
                mode === "password"
                  ? "bg-surface text-foreground shadow-elevation-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Password
            </button>
          </div>

          {mode === "magic-link" ? <MagicLinkForm /> : <PasswordForm />}

          {authError && (
            <p className="text-center text-sm text-danger">
              That sign-in link didn&apos;t work — request a new one below.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Magic-link OR password auth. First sign-in is always magic-link (no
 * password exists yet); app/set-password prompts them to set one afterward
 * so this tab becomes usable going forward.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}
