"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type MaintenanceType = "oil_change" | "tires" | "brakes" | "gov_inspection_fee" | "insurance_payment" | "bodywork" | "cleaning" | "other";

interface Vehicle { id: string; make: string; model: string; plate: string; year: number; odometer_km: number | null; }
interface Garage  { id: string; name: string; phone: string | null; }

interface Log {
  id: string; vehicle_id: string; date: string; type: MaintenanceType; description: string | null;
  cost: number; odometer_km: number | null; supplier: string | null; invoice_number: string | null; notes: string | null;
  next_due_km: number | null; next_due_date: string | null; next_due_label: string | null;
}

interface Props {
  companyId: string;
  vehicles: Vehicle[];
  garages: Garage[];
  log?: Log;
  defaultVehicleId?: string;
}

const TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change: "Oil change", tires: "Tires", brakes: "Brakes",
  gov_inspection_fee: "Gov. inspection fee", insurance_payment: "Insurance payment",
  bodywork: "Bodywork / paint", cleaning: "Cleaning / detailing", other: "Other",
};

const inp = "mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

export function MaintenanceForm({ companyId, vehicles, garages, log, defaultVehicleId }: Props) {
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

  const [reminderOn,    setReminderOn]    = useState(!!(log?.next_due_km || log?.next_due_date));
  const [nextDueLabel,  setNextDueLabel]  = useState(log?.next_due_label ?? "");
  const [nextDueOffset, setNextDueOffset] = useState(
    log?.next_due_km != null && log?.odometer_km != null
      ? String(log.next_due_km - log.odometer_km)
      : log?.next_due_km != null ? String(log.next_due_km) : ""
  );
  const [nextDueDate,   setNextDueDate]   = useState(log?.next_due_date ?? "");

  const [status,   setStatus]   = useState<"idle" | "saving" | "deleting">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (e.target.name === "type" && !reminderOn) {
      setNextDueLabel(TYPE_LABELS[e.target.value as MaintenanceType] ?? "");
    }
  }

  function selectGarage(name: string) {
    setForm((p) => ({ ...p, supplier: name }));
  }

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicle_id);
  const currentOdo = form.odometer_km ? parseInt(form.odometer_km) : selectedVehicle?.odometer_km ?? null;
  const nextDueKmAbsolute = nextDueOffset && currentOdo != null
    ? currentOdo + parseInt(nextDueOffset)
    : nextDueOffset ? parseInt(nextDueOffset) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!form.vehicle_id) { setErrorMsg("Please select a car."); return; }
    if (!form.date) { setErrorMsg("Date is required."); return; }
    const cost = parseFloat(form.cost);
    if (isNaN(cost) || cost < 0) { setErrorMsg("Enter a valid cost (0 or more)."); return; }

    setStatus("saving");
    const supabase = getAuthBrowserClient();

    const label = reminderOn
      ? (nextDueLabel.trim() || TYPE_LABELS[form.type])
      : null;

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
      next_due_km:    reminderOn && nextDueKmAbsolute ? nextDueKmAbsolute : null,
      next_due_date:  reminderOn && nextDueDate ? nextDueDate : null,
      next_due_label: label,
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
      {errorMsg && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>}

      {/* Car */}
      <Field label="Car *">
        <select name="vehicle_id" value={form.vehicle_id} onChange={set} className={inp}>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} — {v.plate}</option>
          ))}
        </select>
      </Field>

      {/* Date & Type */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date *" hint="DD.MM.YYYY">
          <input name="date" type="date" required value={form.date} onChange={set} className={inp} />
        </Field>
        <Field label="Type *">
          <select name="type" value={form.type} onChange={set} className={inp}>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Description */}
      <Field label="Description">
        <input name="description" value={form.description} onChange={set}
          placeholder="e.g. Changed all 4 tires to winter set, Hankook 205/55R16" className={inp} />
      </Field>

      {/* Cost & Odometer */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cost (€) *">
          <input name="cost" type="number" min={0} step={0.01} required value={form.cost} onChange={set} placeholder="0.00" className={inp} />
        </Field>
        <Field label="Odometer (km)">
          <input name="odometer_km" type="number" min={0} value={form.odometer_km} onChange={set} placeholder="85000" className={inp} />
        </Field>
      </div>

      {/* Supplier / Garage */}
      <Field label="Supplier / Garage">
        {garages.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5 mb-1.5">
            {garages.map((g) => (
              <button key={g.id} type="button" onClick={() => selectGarage(g.name)}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors
                  ${form.supplier === g.name
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-border bg-slate-50 text-neutral-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                  }`}>
                {g.name}
              </button>
            ))}
          </div>
        )}
        <input name="supplier" value={form.supplier} onChange={set}
          placeholder={garages.length > 0 ? "Or type a custom garage…" : "e.g. Auto Serviss SIA"} className={inp} />
      </Field>

      {/* Invoice */}
      <Field label="Invoice number">
        <input name="invoice_number" value={form.invoice_number} onChange={set} placeholder="INV-2024-001" className={inp} />
      </Field>

      {/* Notes */}
      <Field label="Notes">
        <textarea name="notes" rows={2} value={form.notes} onChange={set} placeholder="Any additional internal notes…" className={inp} />
      </Field>

      {/* ── Service reminder ── */}
      <div className="rounded-xl border border-border bg-slate-50 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={reminderOn} onChange={(e) => {
            setReminderOn(e.target.checked);
            if (e.target.checked && !nextDueLabel) setNextDueLabel(TYPE_LABELS[form.type]);
          }} className="h-4 w-4 rounded border-border text-brand-700" />
          <span className="text-sm font-medium text-neutral-800">Set reminder for next service</span>
        </label>

        {reminderOn && (
          <div className="mt-4 space-y-4">
            <Field label="Reminder label">
              <input value={nextDueLabel} onChange={(e) => setNextDueLabel(e.target.value)}
                placeholder={TYPE_LABELS[form.type]} className={inp} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Due in km</label>
                <input type="number" min={0} step={1000} value={nextDueOffset}
                  onChange={(e) => setNextDueOffset(e.target.value)}
                  placeholder="e.g. 60000" className={inp} />
                {nextDueKmAbsolute != null && (
                  <p className="mt-1 text-xs text-neutral-400">
                    Due at <span className="font-semibold text-neutral-700">{nextDueKmAbsolute.toLocaleString()} km</span>
                    {currentOdo != null && ` (+${parseInt(nextDueOffset || "0").toLocaleString()} from now)`}
                  </p>
                )}
              </div>
              <Field label="Due date" hint="DD.MM.YYYY">
                <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className={inp} />
              </Field>
            </div>

            {!nextDueOffset && !nextDueDate && (
              <p className="text-xs text-amber-600">Set at least one of: due in km or due date.</p>
            )}
          </div>
        )}
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
