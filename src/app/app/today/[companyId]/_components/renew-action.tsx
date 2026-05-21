"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface Props {
  bookingId: string;
  customerName: string;
  plate: string;
  currentEndAt: string;        // ISO
  renewalPeriodDays: number;
  pricePerPeriod: number | null;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function RenewAction({ bookingId, customerName, plate, currentEndAt, renewalPeriodDays, pricePerPeriod }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(pricePerPeriod != null ? String(pricePerPeriod) : "");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const newEndAt = addDays(currentEndAt, renewalPeriodDays);

  async function handleRenew() {
    setSaving(true);
    setError("");
    const supabase = getAuthBrowserClient();
    const { error: err } = await supabase
      .from("bookings")
      .update({
        end_at: newEndAt,
        paid_at: paidDate ? new Date(paidDate).toISOString() : null,
        booking_price: amount ? parseFloat(amount) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    setSaving(false);
    if (err) { setError(err.message); return; }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
      >
        Mark renewed
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-brand-900">
        Renew — {customerName} / {plate}
      </p>
      <p className="text-xs text-neutral-600">
        New period: <span className="font-medium">{fmtDate(currentEndAt)} → {fmtDate(newEndAt)}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Amount paid (€)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Payment date</span>
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleRenew}
          disabled={saving}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Confirm renewal"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
