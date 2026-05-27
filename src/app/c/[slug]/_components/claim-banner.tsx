"use client";

import { useState } from "react";

export function ClaimBanner({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/claim/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, email, name, message }),
      });
      if (!res.ok) {
        const d = await res.json();
        if (d.error?.includes("already been claimed")) {
          setStatus("done");
          return;
        }
        throw new Error(d.error);
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="border-t border-border bg-emerald-50 px-6 py-8">
        <div className="mx-auto max-w-7xl lg:px-2">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 text-2xl">✓</span>
            <div>
              <p className="font-semibold text-emerald-900">Request received!</p>
              <p className="mt-1 text-sm text-emerald-700">
                We'll review your request and send you access within 24 hours. Keep an eye on your inbox.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-brand-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        {!open ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-white">Is this your business?</p>
              <p className="mt-1 text-sm text-brand-200">
                Claim this listing to manage your fleet, bookings and calendar — free to start.
              </p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
            >
              Claim this listing →
            </button>
          </div>
        ) : (
          <div className="max-w-lg">
            <p className="mb-4 font-semibold text-white">Claim {companyName}</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-200">Your name</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full rounded-lg border border-brand-800 bg-brand-900 px-3 py-2 text-sm text-white placeholder:text-brand-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-200">Business email</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourcompany.com"
                    className="w-full rounded-lg border border-brand-800 bg-brand-900 px-3 py-2 text-sm text-white placeholder:text-brand-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-200">Anything to add? <span className="text-brand-500">(optional)</span></label>
                <input
                  type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. I'm the owner, phone is…"
                  className="w-full rounded-lg border border-brand-800 bg-brand-900 px-3 py-2 text-sm text-white placeholder:text-brand-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              {status === "error" && (
                <p className="text-sm text-red-300">Something went wrong. Please try again or email us directly.</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="submit" disabled={status === "sending"}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100 disabled:opacity-60"
                >
                  {status === "sending" ? "Sending…" : "Send request"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm text-brand-300 hover:text-white">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
