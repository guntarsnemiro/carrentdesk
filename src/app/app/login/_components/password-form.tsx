"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export function PasswordForm({ searchParams }: Props) {
  const { next, error: urlError } = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "forgot" | "sent">("sign-in");
  const [status, setStatus] = useState<"idle" | "working" | "error">(
    urlError === "link_expired" ? "error" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState(
    urlError === "link_expired" ? "That link has expired. Sign in with your password, or set a new one." : "",
  );

  const destination = next && next.startsWith("/") ? next : "/app/setup";

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("working");
    setErrorMsg("");
    const supabase = getAuthBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setStatus("error");
      setErrorMsg("Email or password is wrong.");
      return;
    }
    router.push(destination);
    router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setStatus("working");
    setErrorMsg("");
    const supabase = getAuthBrowserClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/app/login/new-password`
        : "/auth/callback?next=/app/login/new-password";
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("idle");
    setMode("sent");
  }

  if (mode === "sent") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
        <p className="text-sm font-medium text-emerald-800">Check {email}</p>
        <p className="mt-1 text-sm text-emerald-700">
          We sent a link to set your password. It expires in one hour.
        </p>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={handleForgot} className="space-y-4">
        <p className="text-sm text-neutral-500">
          Enter the email on the account. We will send a link to set a password.
        </p>
        {errorMsg && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMsg}</p>}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={status === "working"}
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {status === "working" ? "Sending…" : "Send password link"}
        </button>
        <button
          type="button"
          onClick={() => { setMode("sign-in"); setErrorMsg(""); setStatus("idle"); }}
          className="w-full text-center text-xs text-neutral-500 hover:text-neutral-700"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      {errorMsg && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{errorMsg}</p>}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <button
        type="submit"
        disabled={status === "working"}
        className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
      >
        {status === "working" ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        onClick={() => { setMode("forgot"); setErrorMsg(""); setStatus("idle"); }}
        className="w-full text-center text-xs text-neutral-500 hover:text-neutral-700"
      >
        Forgot password?
      </button>
    </form>
  );
}
