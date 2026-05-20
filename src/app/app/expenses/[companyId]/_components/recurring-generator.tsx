"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

export interface RecurringExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  supplier: string | null;
  invoice_number: string | null;
  notes: string | null;
}

interface Props {
  companyId: string;
  /** All recurring expenses */
  recurring: RecurringExpense[];
  /** Descriptions+categories already present in the current month */
  thisMonthKeys: string[]; // `${category}||${description}`
  currentMonthLabel: string; // e.g. "May 2026"
  firstOfMonth: string;     // e.g. "2026-05-01"
}

function fmt(n: number) {
  return n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RecurringGenerator({ companyId, recurring, thisMonthKeys, currentMonthLabel, firstOfMonth }: Props) {
  const pending = recurring.filter((e) => !thisMonthKeys.includes(`${e.category}||${e.description}`));

  const [open,     setOpen]     = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(pending.map((e) => e.id)));
  const [busy,     setBusy]     = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  if (pending.length === 0 || done) return null;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function generate() {
    const toInsert = pending.filter((e) => selected.has(e.id));
    if (toInsert.length === 0) return;
    setBusy(true); setError("");
    type ExpCat = "salary" | "tax" | "rent" | "phone_internet" | "accounting_legal" | "supplies_stock" | "company_insurance" | "other";
    const rows = toInsert.map((e) => ({
      company_id:     companyId,
      date:           firstOfMonth,
      category:       e.category as ExpCat,
      description:    e.description,
      amount:         e.amount,
      supplier:       e.supplier,
      invoice_number: e.invoice_number,
      notes:          e.notes,
      is_recurring:   true,
    }));
    const { error: err } = await getAuthBrowserClient().from("company_expenses").insert(rows);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    window.location.reload();
  }

  const total = pending.filter((e) => selected.has(e.id)).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {pending.length} recurring expense{pending.length > 1 ? "s" : ""} not yet logged for {currentMonthLabel}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Rent, salaries, phone bills — generate them in one click and adjust if amounts changed.
          </p>
        </div>
        <button onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
          {open ? "Hide" : "Review & generate"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-2">
          {error && <p className="text-xs text-red-700">{error}</p>}

          <ul className="divide-y divide-amber-100 rounded-xl border border-amber-200 bg-white overflow-hidden">
            {pending.map((e) => (
              <li key={e.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-amber-50/50">
                  <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{e.description}</p>
                    {e.supplier && <p className="text-xs text-neutral-400">{e.supplier}</p>}
                  </div>
                  <p className="text-sm font-semibold text-neutral-800 tabular-nums">€{fmt(e.amount)}</p>
                </label>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-1">
            <p className="text-sm text-amber-800">
              {selected.size} selected · total <span className="font-bold">€{fmt(total)}</span>
              <span className="ml-2 text-xs text-amber-600">→ dated {firstOfMonth.split("-").reverse().join(".")}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)}
                className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">
                Cancel
              </button>
              <button onClick={generate} disabled={busy || selected.size === 0}
                className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                {busy ? "Generating…" : `Generate ${selected.size} expense${selected.size > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
