"use client";

import { useState } from "react";
import { approveGlobalReport, rejectGlobalReport } from "@/app/actions/blacklist";

export function BlacklistReviewActions({ reportId }: { reportId: string }) {
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [err, setErr] = useState("");

  if (done) {
    return (
      <span className={`text-sm font-semibold ${done === "approved" ? "text-green-700" : "text-neutral-400"}`}>
        {done === "approved" ? "✓ Approved" : "✗ Rejected"}
      </span>
    );
  }

  async function handleApprove() {
    setBusy(true);
    const res = await approveGlobalReport(reportId);
    if (!res.ok) { setErr(res.error ?? "Error"); setBusy(false); return; }
    setDone("approved");
  }

  async function handleReject() {
    setBusy(true);
    const res = await rejectGlobalReport(reportId, rejectReason);
    if (!res.ok) { setErr(res.error ?? "Error"); setBusy(false); return; }
    setDone("rejected");
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      {!showReject ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={busy}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {busy ? "…" : "Approve"}
          </button>
          <button
            onClick={() => setShowReject(true)}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-2">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            className="w-52 rounded-lg border border-border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={busy}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "…" : "Confirm reject"}
            </button>
            <button
              onClick={() => setShowReject(false)}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}
