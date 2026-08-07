"use client";

import { useState } from "react";

type CityOption = { slug: string; name: string; country: string };

type ListingMatch = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  google_reviews: number | null;
};

type Step = "form" | "matches" | "success";

type SuccessKind = "created" | "claim_pending" | "existing_account";

export function JoinForm({ cityOptions }: { cityOptions: CityOption[] }) {
  const [step, setStep] = useState<Step>("form");
  const [successKind, setSuccessKind] = useState<SuccessKind>("created");
  const [companyName, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [matches, setMatches] = useState<ListingMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFindMatches(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!companyName.trim() || !contactName.trim() || !email.trim() || !phone.trim() || !city) return;
    setLoading(true);
    try {
      const res = await fetch("/api/join/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          city,
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMatches(data.matches ?? []);
      setStep("matches");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function finishJoin(mode: "create" | "claim", companyId?: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          companyId,
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSuccessKind(data.mode === "claim_pending" ? "claim_pending" : data.mode === "existing_account" ? "existing_account" : "created");
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
        {successKind === "claim_pending" ? (
          <>
            <h2 className="text-xl font-bold text-neutral-900">Claim request received</h2>
            <p className="mt-2 text-sm text-neutral-500">
              We&apos;ll review your request for <span className="font-semibold text-neutral-700">{companyName}</span> and email{" "}
              <span className="font-semibold text-neutral-700">{email}</span> once approved — usually within 1 business day.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-neutral-900">Check your inbox</h2>
            <p className="mt-2 text-sm text-neutral-500">
              We sent a sign-in link to <span className="font-semibold text-neutral-700">{email}</span>.
              <br />Click it to open your operations dashboard.
            </p>
          </>
        )}
        <p className="mt-4 text-xs text-neutral-400">No email? Check your spam folder or try again.</p>
        <button
          onClick={() => {
            setStep("form");
            setError("");
            setMatches([]);
          }}
          className="mt-3 text-xs text-brand-700 underline-offset-2 hover:underline"
        >
          Start over
        </button>
      </div>
    );
  }

  if (step === "matches") {
    const cityLabel = cityOptions.find((c) => c.slug === city)?.name ?? city;

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Is this your business?</h2>
          <p className="mt-1 text-sm text-neutral-500">
            We found {matches.length > 0 ? "listing(s)" : "no listings"} in {cityLabel} that may match{" "}
            <span className="font-medium text-neutral-700">{companyName}</span>.
          </p>
        </div>

        {matches.length > 0 && (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.id} className="rounded-xl border border-border bg-white p-4">
                <p className="font-medium text-neutral-900">{m.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {cityLabel} · {m.country}
                  {m.google_reviews ? ` · ${m.google_rating ?? "—"}★ (${m.google_reviews} reviews)` : ""}
                </p>
                {m.website && (
                  <p className="mt-1 truncate text-xs text-neutral-400">{m.website.replace(/^https?:\/\/(www\.)?/, "")}</p>
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => finishJoin("claim", m.id)}
                  className="mt-3 w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                >
                  {loading ? "Submitting…" : "Yes, claim this listing →"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl border border-dashed border-border bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-800">
            {matches.length > 0 ? "None of these?" : "No matching listing found"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            We&apos;ll create a new listing for {companyName} in {cityLabel}.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => finishJoin("create")}
            className="mt-3 w-full rounded-lg border border-border bg-white py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create new listing →"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => { setStep("form"); setError(""); }}
          className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600"
        >
          ← Back to form
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleFindMatches} className="space-y-4">
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
          placeholder="Easy Rent Pula"
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-neutral-700">
          Your name
        </label>
        <input
          id="contactName"
          type="text"
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Denis"
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-neutral-700">
          City
        </label>
        <select
          id="city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Select your city</option>
          {cityOptions.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}, {c.country}
            </option>
          ))}
        </select>
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

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
          Your phone
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+385 99 123 4567"
          className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Your mobile or direct line for us to reach you — can differ from your public listing number.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
      >
        {loading ? "Checking listings…" : "Continue →"}
      </button>

      <p className="text-center text-xs text-neutral-400">
        No credit card required · Cancel anytime
      </p>
    </form>
  );
}
