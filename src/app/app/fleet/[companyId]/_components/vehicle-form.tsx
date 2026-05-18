"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type VehicleStatus   = "available" | "rented" | "maintenance" | "retired";
type VehicleCategory = "economy" | "compact" | "midsize" | "suv" | "van" | "luxury" | "other";
type VehicleFuel     = "diesel" | "petrol" | "electric" | "hybrid" | "lpg";

interface Vehicle {
  id: string;
  make: string; model: string; year: number; plate: string; color: string | null;
  category: VehicleCategory; status: VehicleStatus;
  fuel: VehicleFuel | null; seats: number | null;
  vin: string | null; registration_number: string | null;
  odometer_km: number | null;
  gov_inspection_date: string | null; gov_inspection_next: string | null;
  service_date: string | null; service_next: string | null;
  insurance_number: string | null; insurance_valid_until: string | null;
  notes: string | null;
}

interface Props { companyId: string; vehicle?: Vehicle; }

const CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "economy", label: "Economy" }, { value: "compact", label: "Compact" },
  { value: "midsize", label: "Midsize" }, { value: "suv",     label: "SUV"     },
  { value: "van",     label: "Van"     }, { value: "luxury",  label: "Luxury"  },
  { value: "other",   label: "Other"   },
];
const FUELS: { value: VehicleFuel; label: string }[] = [
  { value: "diesel",   label: "Diesel"   }, { value: "petrol",  label: "Petrol"  },
  { value: "electric", label: "Electric" }, { value: "hybrid",  label: "Hybrid"  },
  { value: "lpg",      label: "LPG"      },
];
const STATUSES: { value: VehicleStatus; label: string }[] = [
  { value: "available",   label: "Available"   }, { value: "rented",      label: "Rented"      },
  { value: "maintenance", label: "Maintenance" }, { value: "retired",     label: "Retired"     },
];

export function VehicleForm({ companyId, vehicle }: Props) {
  const router  = useRouter();
  const isEdit  = Boolean(vehicle);

  const [form, setForm] = useState({
    make:     vehicle?.make  ?? "",
    model:    vehicle?.model ?? "",
    year:     vehicle?.year  ? String(vehicle.year) : String(new Date().getFullYear() - 2),
    plate:    vehicle?.plate ?? "",
    color:    vehicle?.color ?? "",
    category: (vehicle?.category ?? "economy") as VehicleCategory,
    status:   (vehicle?.status   ?? "available") as VehicleStatus,
    fuel:     (vehicle?.fuel     ?? "") as VehicleFuel | "",
    seats:    vehicle?.seats != null ? String(vehicle.seats) : "",
    vin:                    vehicle?.vin ?? "",
    registration_number:    vehicle?.registration_number ?? "",
    odometer_km:            vehicle?.odometer_km != null ? String(vehicle.odometer_km) : "",
    gov_inspection_date:    vehicle?.gov_inspection_date ?? "",
    gov_inspection_next:    vehicle?.gov_inspection_next ?? "",
    service_date:           vehicle?.service_date ?? "",
    service_next:           vehicle?.service_next ?? "",
    insurance_number:       vehicle?.insurance_number ?? "",
    insurance_valid_until:  vehicle?.insurance_valid_until ?? "",
    notes:    vehicle?.notes ?? "",
  });

  const [status, setStatus] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const supabase = getAuthBrowserClient();
    const payload = {
      company_id:             companyId,
      make:                   form.make.trim(),
      model:                  form.model.trim(),
      year:                   parseInt(form.year, 10),
      plate:                  form.plate.trim().toUpperCase(),
      color:                  form.color.trim()  || null,
      category:               form.category,
      status:                 form.status,
      fuel:                   (form.fuel || null) as VehicleFuel | null,
      seats:                  form.seats ? parseInt(form.seats, 10) : null,
      vin:                    form.vin.trim()                   || null,
      registration_number:    form.registration_number.trim()  || null,
      odometer_km:            form.odometer_km ? parseInt(form.odometer_km, 10) : null,
      gov_inspection_date:    form.gov_inspection_date    || null,
      gov_inspection_next:    form.gov_inspection_next    || null,
      service_date:           form.service_date           || null,
      service_next:           form.service_next           || null,
      insurance_number:       form.insurance_number.trim()     || null,
      insurance_valid_until:  form.insurance_valid_until  || null,
      notes:                  form.notes.trim()           || null,
      updated_at:             new Date().toISOString(),
    };

    const { error } = isEdit
      ? await supabase.from("vehicles").update(payload).eq("id", vehicle!.id)
      : await supabase.from("vehicles").insert(payload);

    if (error) { setStatus("error"); setErrorMsg(error.message); return; }
    router.push(`/app/fleet/${companyId}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!vehicle || !confirm(`Delete ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.plate})?`)) return;
    setStatus("deleting");
    await getAuthBrowserClient().from("vehicles").delete().eq("id", vehicle.id);
    router.push(`/app/fleet/${companyId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Basic ── */}
      <Section title="Basic information">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <Field label="Make *"><input name="make" required value={form.make} onChange={set} placeholder="Toyota" className={inp} /></Field>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Field label="Model *"><input name="model" required value={form.model} onChange={set} placeholder="Corolla" className={inp} /></Field>
          </div>
          <div>
            <Field label="Year *"><input name="year" type="number" required min={1990} max={2030} value={form.year} onChange={set} className={inp} /></Field>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <Field label="Plate *"><input name="plate" required value={form.plate} onChange={set} placeholder="ABC-123" className={`${inp} font-mono uppercase`} /></Field>
          </div>
          <div>
            <Field label="Color"><input name="color" value={form.color} onChange={set} placeholder="White" className={inp} /></Field>
          </div>
          <div>
            <Field label="Fuel *">
              <select name="fuel" required value={form.fuel} onChange={set} className={inp}>
                <option value="">Select…</option>
                {FUELS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Seats *"><input name="seats" type="number" required min={1} max={20} value={form.seats} onChange={set} placeholder="5" className={inp} /></Field>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Field label="Category">
              <select name="category" value={form.category} onChange={set} className={inp}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Status">
              <select name="status" value={form.status} onChange={set} className={inp}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Documents ── */}
      <Section title="Documents">
        <div className="grid grid-cols-2 gap-4">
          <Field label="VIN number">
            <input name="vin" value={form.vin} onChange={set} placeholder="WBA12345678901234" className={`${inp} font-mono uppercase`} />
          </Field>
          <Field label="Registration document number">
            <input name="registration_number" value={form.registration_number} onChange={set} placeholder="LV-123456" className={inp} />
          </Field>
        </div>
        <Field label="Odometer (km)">
          <input name="odometer_km" type="number" min={0} value={form.odometer_km} onChange={set} placeholder="85000" className={inp} />
        </Field>
      </Section>

      {/* ── Government technical inspection ── */}
      <Section title="Government technical inspection">
        <p className="mb-3 text-xs text-neutral-400">The mandatory state roadworthiness test (e.g. Latvian TA, Estonian ÜTV, Lithuanian TA).</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Last inspection date">
            <input name="gov_inspection_date" type="date" value={form.gov_inspection_date} onChange={set} className={inp} />
          </Field>
          <Field label="Next inspection due">
            <input name="gov_inspection_next" type="date" value={form.gov_inspection_next} onChange={set} className={inp} />
          </Field>
        </div>
      </Section>

      {/* ── Maintenance service ── */}
      <Section title="Maintenance service">
        <p className="mb-3 text-xs text-neutral-400">Your internal full technical service (oil change, filters, brakes, etc.).</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Last service date">
            <input name="service_date" type="date" value={form.service_date} onChange={set} className={inp} />
          </Field>
          <Field label="Next service due">
            <input name="service_next" type="date" value={form.service_next} onChange={set} className={inp} />
          </Field>
        </div>
      </Section>

      {/* ── Insurance ── */}
      <Section title="Insurance">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Policy number">
            <input name="insurance_number" value={form.insurance_number} onChange={set} placeholder="POL-12345678" className={inp} />
          </Field>
          <Field label="Valid until">
            <input name="insurance_valid_until" type="date" value={form.insurance_valid_until} onChange={set} className={inp} />
          </Field>
        </div>
      </Section>

      {/* ── Notes ── */}
      <Section title="Internal notes">
        <textarea name="notes" rows={3} value={form.notes} onChange={set}
          placeholder="Damage history, quirks, anything the team should know…"
          className={inp} />
      </Section>

      {errorMsg && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>}

      <div className="flex items-center justify-between pb-10">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={status === "saving" || status === "deleting"}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {status === "saving" ? "Saving…" : isEdit ? "Save changes" : "Add vehicle"}
          </button>
          <a href={`/app/fleet/${companyId}`} className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
            Cancel
          </a>
        </div>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={status === "deleting" || status === "saving"}
            className="text-sm text-red-500 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-50">
            {status === "deleting" ? "Deleting…" : "Delete vehicle"}
          </button>
        )}
      </div>
    </form>
  );
}

const inp = "mt-1 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      {children}
    </div>
  );
}
