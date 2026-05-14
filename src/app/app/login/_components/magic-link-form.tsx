"use client";

import { use, useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export function MagicLinkForm({ searchParams }: Props) {
  const { next, error: urlError } = use(searchParams);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    urlError === "link_expired" ? "error" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState(
    urlError === "link_expired"
      ? "This sign-in link has expired. Please request a new one."
      : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = getAuthBrowserClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`
        : "/auth/callback";

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false, // only pre-approved operators can sign in
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-emerald-50 px-4 py-5 text-center">
        <p className="text-sm font-medium text-emerald-800">
          Check your inbox
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          We sent a sign-in link to <strong>{email}</strong>. It expires in 1
          hour.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setEmail("");
          }}
          className="mt-4 text-xs text-emerald-600 underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
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
