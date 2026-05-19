"use client";

import { useState } from "react";

type Step = "form" | "success";

export function JoinForm() {
  const [step, setStep]           = useState<Step>("form");
  const [companyName, setCompany] = useState("");
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!companyName.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Check your inbox</h2>
        <p className="mt-2 text-sm text-neutral-500">
          We sent a sign-in link to <span className="font-semibold text-neutral-700">{email}</span>.
          <br />Click it to open your operations dashboard.
        </p>
        <p className="mt-4 text-xs text-neutral-400">No email? Check your spam folder or try again.</p>
        <button
          onClick={() => { setStep("form"); setError(""); }}
          className="mt-3 text-xs text-brand-700 underline-offset-2 hover:underline"
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700">
          Company name
        </label>
        <input
          id="companyName"
          type="text"
          required
          value={companyName}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Baltic Car Rent"
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Your email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourrental.com"
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
      >
        {loading ? "Setting up your account…" : "Start free trial →"}
      </button>

      <p className="text-center text-xs text-neutral-400">
        No credit card required · Free during beta
      </p>
    </form>
  );
}
