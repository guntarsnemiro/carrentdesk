"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

export interface Payee { id: string; name: string; notes: string | null; }

interface Props { companyId: string; initial: Payee[]; }

const inp = "flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";
const sml = "rounded-lg border border-border px-3 py-2 text-sm";

export function PayeeManager({ companyId, initial }: Props) {
  const [payees,  setPayees]  = useState<Payee[]>(initial);
  const [adding,  setAdding]  = useState(false);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ name: "", notes: "" });
  const [editForm, setEditForm] = useState({ name: "", notes: "" });
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");
  const supabase = getAuthBrowserClient();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    setBusy(true); setError("");
    const { data, error: err } = await supabase
      .from("expense_payees")
      .insert({ company_id: companyId, name: newForm.name.trim(), notes: newForm.notes.trim() || null })
      .select("id, name, notes").single();
    setBusy(false);
    if (err || !data) { setError(err?.message ?? "Failed to add"); return; }
    setPayees((p) => [...p, data]);
    setNewForm({ name: "", notes: "" });
    setAdding(false);
  }

  async function handleSave(id: string) {
    if (!editForm.name.trim()) return;
    setBusy(true); setError("");
    const { error: err } = await supabase.from("expense_payees")
      .update({ name: editForm.name.trim(), notes: editForm.notes.trim() || null })
      .eq("id", id).eq("company_id", companyId);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setPayees((p) => p.map((x) => x.id === id ? { ...x, name: editForm.name.trim(), notes: editForm.notes.trim() || null } : x));
    setEditId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this payee?")) return;
    setBusy(true); setError("");
    const { error: err } = await supabase.from("expense_payees").delete().eq("id", id).eq("company_id", companyId);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setPayees((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div>
      {error && <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      <ul className="space-y-2">
        {payees.length === 0 && !adding && (
          <li className="text-sm text-neutral-400 py-1">No payees saved yet. Add government agencies, utilities, landlord, etc.</li>
        )}
        {payees.map((p) => (
          <li key={p.id}>
            {editId === p.id ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(p.id); }} className="flex gap-2">
                <input autoFocus value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Payee name *" className={inp} />
                <input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes (optional)" className={inp} />
                <button type="submit" disabled={busy} className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setEditId(null)} className={`${sml} text-neutral-600 hover:bg-slate-100`}>✕</button>
              </form>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-50 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                  {p.notes && <p className="text-xs text-neutral-400 mt-0.5">{p.notes}</p>}
                </div>
                <button onClick={() => { setEditId(p.id); setEditForm({ name: p.name, notes: p.notes ?? "" }); setAdding(false); }}
                  className={`${sml} text-neutral-500 hover:bg-slate-200`} title="Edit">✏</button>
                <button onClick={() => handleDelete(p.id)} disabled={busy}
                  className={`${sml} text-red-500 hover:bg-red-50 disabled:opacity-50`} title="Remove">×</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <input autoFocus value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Payee name *" className={inp} />
          <input value={newForm.notes} onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)" className={inp} />
          <button type="submit" disabled={busy || !newForm.name.trim()}
            className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
            {busy ? "…" : "Add"}
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewForm({ name: "", notes: "" }); }}
            className={`${sml} text-neutral-600 hover:bg-slate-100`}>✕</button>
        </form>
      ) : (
        <button onClick={() => { setAdding(true); setEditId(null); }}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 px-3 py-2 text-sm font-medium text-brand-700 hover:border-brand-500 hover:bg-brand-50">
          + Add payee
        </button>
      )}
    </div>
  );
}
