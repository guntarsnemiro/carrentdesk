"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export function MagicLinkForm({ searchParams }: Props) {
  const { next, error: urlError } = use(searchParams);
  const router = useRouter();

  const [email, setEmail]   = useState("");
  const [code, setCode]     = useState("");
  const [step, setStep]     = useState<"email" | "code">(
    urlError === "link_expired" ? "email" : "email"
  );
  const [status, setStatus] = useState<"idle" | "sending" | "verifying" | "error">(
    urlError === "link_expired" ? "error" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState(
    urlError === "link_expired"
      ? "This sign-in link has expired. Please request a new one."
      : ""
  );

  const destination = next ?? "/app/dashboard";

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = getAuthBrowserClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`
        : "/auth/callback";

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("idle");
      setStep("code");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setErrorMsg("");

    const supabase = getAuthBrowserClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    if (error) {
      setStatus("error");
      setErrorMsg("Invalid or expired code. Check the email or request a new link.");
    } else {
      router.push(destination);
      router.refresh();
    }
  }

  // ── Step 1: Email entry ──────────────────────────────────────────────────
  if (step === "email") {
    return (
      <form onSubmit={handleSendEmail} className="space-y-4">
        {errorMsg && (
          <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending" || !email.trim()}
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send sign-in link"}
        </button>
      </form>
    );
  }

  // ── Step 2: Code entry (after email sent) ───────────────────────────────
  return (
    <div className="space-y-5">
      {/* Confirmation banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
        <p className="text-sm font-medium text-emerald-800">Email sent to {email}</p>
        <p className="mt-1 text-sm text-emerald-700">
          Check your inbox for a sign-in link <strong>or</strong> the 6-digit code below.
        </p>
      </div>

      {/* Code form */}
      <form onSubmit={handleVerifyCode} className="space-y-3">
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-neutral-700">
            6-digit code from the email
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-center text-xl font-mono tracking-[0.4em] text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
          />
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "verifying" || code.length < 6}
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "verifying" ? "Verifying…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-xs text-neutral-400">
        Wrong email or no email?{" "}
        <button
          onClick={() => { setStep("email"); setCode(""); setErrorMsg(""); setStatus("idle"); }}
          className="text-brand-700 underline-offset-2 hover:underline"
        >
          Try again
        </button>
      </p>
    </div>
  );
}
