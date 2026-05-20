"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface Location { id: string; address: string; is_primary: boolean; }

interface Props {
  companyId: string;
  initial: Location[];
}

const inp = "flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function LocationsManager({ companyId, initial }: Props) {
  const [locations, setLocations] = useState<Location[]>(initial);
  const [newAddress, setNewAddress] = useState("");
  const [adding,     setAdding]     = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editVal,    setEditVal]    = useState("");
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState("");

  const supabase = getAuthBrowserClient();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const address = newAddress.trim();
    if (!address) return;
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase
      .from("locations")
      .insert({ company_id: companyId, address, is_primary: false })
      .select("id, address, is_primary")
      .single();
    setBusy(false);
    if (err || !data) { setError(err?.message ?? "Failed to add"); return; }
    setLocations((prev) => [...prev, data]);
    setNewAddress("");
    setAdding(false);
  }

  async function handleSaveEdit(id: string) {
    const address = editVal.trim();
    if (!address) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase
      .from("locations")
      .update({ address })
      .eq("id", id)
      .eq("company_id", companyId);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setLocations((prev) => prev.map((l) => l.id === id ? { ...l, address } : l));
    setEditId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this location preset?")) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase
      .from("locations")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }

  const presets = locations.filter((l) => !l.is_primary);

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* List */}
      <ul className="space-y-2">
        {presets.length === 0 && !adding && (
          <li className="text-sm text-neutral-400 py-2">No preset locations yet.</li>
        )}
        {presets.map((loc) => (
          <li key={loc.id} className="flex items-center gap-2">
            {editId === loc.id ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(loc.id); }}
                className="flex flex-1 items-center gap-2">
                <input
                  autoFocus
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className={inp}
                />
                <button type="submit" disabled={busy}
                  className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
                  Save
                </button>
                <button type="button" onClick={() => setEditId(null)}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-neutral-600 hover:bg-slate-50">
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1 rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-neutral-800">
                  {loc.address}
                </span>
                <button
                  onClick={() => { setEditId(loc.id); setEditVal(loc.address); setAdding(false); }}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-neutral-500 hover:bg-slate-100"
                  title="Rename">
                  ✏
                </button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  disabled={busy}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                  title="Remove">
                  ×
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Add new */}
      {adding ? (
        <form onSubmit={handleAdd} className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="e.g. Riga Airport Terminal 1"
            className={inp}
          />
          <button type="submit" disabled={busy || !newAddress.trim()}
            className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
            {busy ? "Adding…" : "Add"}
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewAddress(""); }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-neutral-600 hover:bg-slate-50">
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => { setAdding(true); setEditId(null); }}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 px-3 py-2 text-sm font-medium text-brand-700 hover:border-brand-500 hover:bg-brand-50">
          + Add location
        </button>
      )}
    </div>
  );
}
