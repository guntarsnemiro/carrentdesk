"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type MaintenanceType = "oil_change" | "tires" | "brakes" | "gov_inspection_fee" | "insurance_payment" | "bodywork" | "cleaning" | "other";

interface Vehicle { id: string; make: string; model: string; plate: string; year: number; }

interface Log {
  id: string;
  vehicle_id: string;
  date: string;
  type: MaintenanceType;
  description: string | null;
  cost: number;
  odometer_km: number | null;
  supplier: string | null;
  invoice_number: string | null;
  notes: string | null;
}

interface Props {
  companyId: string;
  vehicles: Vehicle[];
  log?: Log;
  defaultVehicleId?: string;
}

const TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change:        "Oil change",
  tires:             "Tires",
  brakes:            "Brakes",
  gov_inspection_fee:"Gov. inspection fee",
  insurance_payment: "Insurance payment",
  bodywork:          "Bodywork / paint",
  cleaning:          "Cleaning / detailing",
  other:             "Other",
};

const inp = "mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function MaintenanceForm({ companyId, vehicles, log, defaultVehicleId }: Props) {
  const isEdit = Boolean(log);
  const today  = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    vehicle_id:     log?.vehicle_id     ?? defaultVehicleId ?? (vehicles[0]?.id ?? ""),
    date:           log?.date           ?? today,
    type:           (log?.type          ?? "other") as MaintenanceType,
    description:    log?.description    ?? "",
    cost:           log?.cost != null   ? String(log.cost) : "",
    odometer_km:    log?.odometer_km != null ? String(log.odometer_km) : "",
    supplier:       log?.supplier       ?? "",
    invoice_number: log?.invoice_number ?? "",
    notes:          log?.notes          ?? "",
  });

  const [status,   setStatus]   = useState<"idle" | "saving" | "deleting">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!form.vehicle_id) { setErrorMsg("Please select a car."); return; }
    if (!form.date)        { setErrorMsg("Date is required."); return; }
    const cost = parseFloat(form.cost);
    if (isNaN(cost) || cost < 0) { setErrorMsg("Enter a valid cost (0 or more)."); return; }

    setStatus("saving");
    const supabase = getAuthBrowserClient();
    const payload = {
      company_id:     companyId,
      vehicle_id:     form.vehicle_id,
      date:           form.date,
      type:           form.type,
      description:    form.description || null,
      cost,
      odometer_km:    form.odometer_km ? parseInt(form.odometer_km) : null,
      supplier:       form.supplier || null,
      invoice_number: form.invoice_number || null,
      notes:          form.notes || null,
    };

    if (isEdit && log) {
      const { error } = await supabase.from("maintenance_logs").update(payload).eq("id", log.id);
      if (error) { setErrorMsg(error.message); setStatus("idle"); return; }
    } else {
      const { error } = await supabase.from("maintenance_logs").insert(payload);
      if (error) { setErrorMsg(error.message); setStatus("idle"); return; }
    }
    window.location.href = `/app/maintenance/${companyId}`;
  }

  async function handleDelete() {
    if (!log || !confirm("Delete this maintenance entry?")) return;
    setStatus("deleting");
    const { error } = await getAuthBrowserClient().from("maintenance_logs").delete().eq("id", log.id);
    if (error) { alert(error.message); setStatus("idle"); return; }
    window.location.href = `/app/maintenance/${companyId}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      )}

      {/* Car */}
      <div>
        <label className="block text-sm font-medium text-neutral-700">Car *</label>
        <select name="vehicle_id" value={form.vehicle_id} onChange={set} className={inp}>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} — {v.plate}</option>
          ))}
        </select>
      </div>

      {/* Date & Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Date *</label>
          <input name="date" type="date" required value={form.date} onChange={set} className={inp} />
          <p className="mt-1 text-xs text-neutral-400">DD.MM.YYYY</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Type *</label>
          <select name="type" value={form.type} onChange={set} className={inp}>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-neutral-700">Description</label>
        <input name="description" value={form.description} onChange={set}
          placeholder="e.g. Changed all 4 tires to winter set, Hankook 205/55R16"
          className={inp} />
      </div>

      {/* Cost & Odometer */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Cost (€) *</label>
          <input name="cost" type="number" min={0} step={0.01} required
            value={form.cost} onChange={set} placeholder="0.00" className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Odometer (km)</label>
          <input name="odometer_km" type="number" min={0}
            value={form.odometer_km} onChange={set} placeholder="85000" className={inp} />
        </div>
      </div>

      {/* Supplier & Invoice */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Supplier / Garage</label>
          <input name="supplier" value={form.supplier} onChange={set}
            placeholder="e.g. Auto Serviss SIA" className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Invoice number</label>
          <input name="invoice_number" value={form.invoice_number} onChange={set}
            placeholder="INV-2024-001" className={inp} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-neutral-700">Notes</label>
        <textarea name="notes" rows={2} value={form.notes} onChange={set}
          placeholder="Any additional internal notes…" className={inp} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {isEdit ? (
          <button type="button" onClick={handleDelete} disabled={status !== "idle"}
            className="text-sm text-red-600 hover:underline disabled:opacity-50">
            {status === "deleting" ? "Deleting…" : "Delete entry"}
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <a href={`/app/maintenance/${companyId}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-slate-50">
            Cancel
          </a>
          <button type="submit" disabled={status !== "idle"}
            className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {status === "saving" ? "Saving…" : isEdit ? "Save changes" : "Add entry"}
          </button>
        </div>
      </div>
    </form>
  );
}
