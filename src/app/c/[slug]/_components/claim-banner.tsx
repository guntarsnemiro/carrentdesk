"use client";

import { useState } from "react";

export function ClaimSidebarCard({ companyId, companyName }: { companyId: string; companyName: string }) {
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
        if (d.error?.includes("already been claimed")) { setStatus("done"); return; }
        throw new Error(d.error);
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-brand-950 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">Request received!</p>
        <p className="mt-1 text-sm text-brand-100">We'll review your request and send you access within 24 hours.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="rounded-2xl bg-brand-950 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">Own this business?</p>
        <p className="mt-2 text-sm text-brand-100">Manage your fleet, bookings and listing — free to start.</p>
        <button
          onClick={() => setOpen(true)}
          className="mt-3 w-full rounded-lg bg-white py-2 text-sm font-semibold text-brand-950 hover:bg-brand-100"
        >
          Claim this listing →
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-brand-950 p-5 text-white">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-300">Claim {companyName}</p>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="mb-1 block text-xs text-brand-300">Your name</label>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="w-full rounded-lg border border-brand-800 bg-brand-900 px-3 py-2 text-sm text-white placeholder:text-brand-600 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-300">Business email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourcompany.com"
            className="w-full rounded-lg border border-brand-800 bg-brand-900 px-3 py-2 text-sm text-white placeholder:text-brand-600 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-300">Message <span className="text-brand-600">(optional)</span></label>
          <input
            type="text" value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. I'm the owner, phone is…"
            className="w-full rounded-lg border border-brand-800 bg-brand-900 px-3 py-2 text-sm text-white placeholder:text-brand-600 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        {status === "error" && (
          <p className="text-xs text-red-300">Something went wrong. Please try again.</p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="submit" disabled={status === "sending"}
            className="flex-1 rounded-lg bg-white py-2 text-sm font-semibold text-brand-950 hover:bg-brand-100 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send request"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-brand-800 px-3 py-2 text-sm text-brand-300 hover:text-white">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
