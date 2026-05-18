"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type VehicleStatus = "available" | "rented" | "maintenance" | "retired";
type VehicleCategory = "economy" | "compact" | "midsize" | "suv" | "van" | "luxury" | "other";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string | null;
  category: VehicleCategory;
  status: VehicleStatus;
  notes: string | null;
}

interface Props {
  companyId: string;
  vehicle?: Vehicle;
}

const CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "economy",  label: "Economy"  },
  { value: "compact",  label: "Compact"  },
  { value: "midsize",  label: "Midsize"  },
  { value: "suv",      label: "SUV"      },
  { value: "van",      label: "Van"      },
  { value: "luxury",   label: "Luxury"   },
  { value: "other",    label: "Other"    },
];

const STATUSES: { value: VehicleStatus; label: string }[] = [
  { value: "available",   label: "Available"   },
  { value: "rented",      label: "Rented"      },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired",     label: "Retired"     },
];

export function VehicleForm({ companyId, vehicle }: Props) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);

  const [form, setForm] = useState({
    make:     vehicle?.make ?? "",
    model:    vehicle?.model ?? "",
    year:     vehicle?.year ? String(vehicle.year) : String(new Date().getFullYear() - 2),
    plate:    vehicle?.plate ?? "",
    color:    vehicle?.color ?? "",
    category: vehicle?.category ?? "economy" as VehicleCategory,
    status:   vehicle?.status ?? "available" as VehicleStatus,
    notes:    vehicle?.notes ?? "",
  });

  const [status, setStatus] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const supabase = getAuthBrowserClient();
    const payload = {
      company_id: companyId,
      make:       form.make.trim(),
      model:      form.model.trim(),
      year:       parseInt(form.year, 10),
      plate:      form.plate.trim().toUpperCase(),
      color:      form.color.trim() || null,
      category:   form.category,
      status:     form.status,
      notes:      form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = isEdit
      ? await supabase.from("vehicles").update(payload).eq("id", vehicle!.id)
      : await supabase.from("vehicles").insert(payload);

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    router.push(`/app/fleet/${companyId}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!vehicle || !confirm(`Delete ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.plate})?`)) return;
    setStatus("deleting");
    const supabase = getAuthBrowserClient();
    await supabase.from("vehicles").delete().eq("id", vehicle.id);
    router.push(`/app/fleet/${companyId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Make / Model / Year */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Vehicle details</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Make</label>
            <input name="make" required value={form.make} onChange={handleChange}
              placeholder="Toyota" className={inputCls} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Model</label>
            <input name="model" required value={form.model} onChange={handleChange}
              placeholder="Corolla" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <input name="year" type="number" required min={1990} max={2030}
              value={form.year} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Plate number</label>
            <input name="plate" required value={form.plate} onChange={handleChange}
              placeholder="ABC-123" className={`${inputCls} font-mono uppercase`} />
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <input name="color" value={form.color} onChange={handleChange}
              placeholder="White" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Category & Status */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Classification</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Notes</h2>
        <textarea name="notes" rows={3} value={form.notes} onChange={handleChange}
          placeholder="Internal notes about this vehicle (damage, quirks, service history…)"
          className={inputCls} />
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pb-10">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={status === "saving" || status === "deleting"}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {status === "saving" ? "Saving…" : isEdit ? "Save changes" : "Add vehicle"}
          </button>
          <a href={`/app/fleet/${companyId}`}
            className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
            Cancel
          </a>
        </div>

        {isEdit && (
          <button type="button" onClick={handleDelete}
            disabled={status === "deleting" || status === "saving"}
            className="text-sm text-red-500 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-50">
            {status === "deleting" ? "Deleting…" : "Delete vehicle"}
          </button>
        )}
      </div>
    </form>
  );
}

const inputCls = "mt-1 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1";
const labelCls = "block text-sm font-medium text-neutral-700";
