"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface Props {
  bookingId: string;
  amount: number;
}

export function ReleaseDeposit({ bookingId, amount }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleRelease() {
    if (!confirm(`Mark €${amount.toFixed(2)} deposit as returned to customer?`)) return;
    setSaving(true);
    setError("");
    const supabase = getAuthBrowserClient();
    const { error: err } = await supabase
      .from("bookings")
      .update({ deposit_returned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    router.refresh();
  }

  if (done) return <span className="text-xs text-emerald-600 font-medium">Released ✓</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleRelease}
        disabled={saving}
        className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
      >
        {saving ? "Saving…" : `Release €${amount.toFixed(2)}`}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
