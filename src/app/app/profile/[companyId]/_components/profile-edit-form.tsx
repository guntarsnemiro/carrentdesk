"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  email: string | null;
  founded_year: number | null;
}

interface Location {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

interface Fleet {
  fleet_count_min: number | null;
  fleet_count_max: number | null;
  fleet_description: string | null;
  transmission_mix: string | null;
  fuel_mix: string | null;
  age_range: string | null;
}

interface Props {
  company: Company;
  location: Location | null;
  fleet: Fleet | null;
  amenities: Record<string, boolean>;
}

const AMENITY_LABELS: Record<string, string> = {
  airport_pickup:    "Airport pickup",
  airport_delivery:  "Airport delivery",
  city_delivery:     "City delivery",
  card_payment:      "Card payment",
  child_seats:       "Child seats available",
  cross_border:      "Cross-border allowed",
  english_staff:     "English-speaking staff",
  long_term_discount:"Long-term discount",
  service_24_7:      "24/7 service",
  winter_tires:      "Winter tires included",
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ProfileEditForm({ company, location, fleet, amenities: initialAmenities }: Props) {
  const [form, setForm] = useState({
    description:    company.description ?? "",
    phone:          company.phone ?? "",
    whatsapp:       company.whatsapp ?? "",
    website:        company.website ?? "",
    email:          company.email ?? "",
    founded_year:   company.founded_year ? String(company.founded_year) : "",
    address:        location?.address ?? "",
    fleet_count_min: fleet?.fleet_count_min != null ? String(fleet.fleet_count_min) : "",
    fleet_count_max: fleet?.fleet_count_max != null ? String(fleet.fleet_count_max) : "",
    fleet_description: fleet?.fleet_description ?? "",
    transmission_mix:  fleet?.transmission_mix ?? "",
    fuel_mix:          fleet?.fuel_mix ?? "",
    age_range:         fleet?.age_range ?? "",
  });

  const [amenities, setAmenities] = useState<Record<string, boolean>>(initialAmenities);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === "saved" || status === "error") setStatus("idle");
  }

  function handleAmenity(key: string, checked: boolean) {
    setAmenities((prev) => ({ ...prev, [key]: checked }));
    if (status === "saved" || status === "error") setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const supabase = getAuthBrowserClient();

    // 1. Update companies
    const { error: companyError } = await supabase
      .from("companies")
      .update({
        description:  form.description || null,
        phone:        form.phone || null,
        whatsapp:     form.whatsapp || null,
        website:      form.website || null,
        email:        form.email || null,
        founded_year: form.founded_year ? parseInt(form.founded_year, 10) : null,
        updated_at:   new Date().toISOString(),
      })
      .eq("id", company.id);

    if (companyError) {
      setStatus("error");
      setErrorMsg(companyError.message);
      return;
    }

    // 2. Update or insert primary location
    if (form.address) {
      if (location) {
        await supabase.from("locations").update({ address: form.address }).eq("id", location.id);
      } else {
        await supabase.from("locations").insert({ company_id: company.id, address: form.address, is_primary: true });
      }
    }

    // 3. Upsert fleet summary
    const fleetPayload = {
      company_id:        company.id,
      fleet_count_min:   form.fleet_count_min ? parseInt(form.fleet_count_min, 10) : null,
      fleet_count_max:   form.fleet_count_max ? parseInt(form.fleet_count_max, 10) : null,
      fleet_description: form.fleet_description || null,
      transmission_mix:  form.transmission_mix || null,
      fuel_mix:          form.fuel_mix || null,
      age_range:         form.age_range || null,
    };

    if (fleet) {
      await supabase.from("company_fleet_summary").update(fleetPayload).eq("company_id", company.id);
    } else {
      await supabase.from("company_fleet_summary").insert(fleetPayload);
    }

    // 4. Save amenities — upsert each changed key
    for (const [key, value] of Object.entries(amenities)) {
      const alreadyExists = key in initialAmenities;
      if (alreadyExists) {
        await supabase.from("company_amenities").update({ value }).eq("company_id", company.id).eq("amenity_key", key);
      } else {
        await supabase.from("company_amenities").insert({ company_id: company.id, amenity_key: key, value });
      }
    }

    setStatus("saved");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* About */}
      <Section title="About your company">
        <Field label="Description" hint="2–4 sentences shown on your public profile.">
          <textarea
            name="description" rows={4} value={form.description} onChange={handleChange}
            placeholder="We are an independent car rental company with 15 years of experience…"
            className={inputCls}
          />
        </Field>
        <Field label="Founded year" hint="e.g. 2008">
          <input type="number" name="founded_year" min={1900} max={new Date().getFullYear()}
            value={form.founded_year} onChange={handleChange} placeholder="2008" className={inputCls} />
        </Field>
      </Section>

      {/* Fleet */}
      <Section title="Fleet">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min vehicles">
            <input type="number" name="fleet_count_min" min={0} value={form.fleet_count_min}
              onChange={handleChange} placeholder="40" className={inputCls} />
          </Field>
          <Field label="Max vehicles">
            <input type="number" name="fleet_count_max" min={0} value={form.fleet_count_max}
              onChange={handleChange} placeholder="60" className={inputCls} />
          </Field>
        </div>
        <Field label="Fleet description" hint="Brief description of vehicle types, ages, fuel types.">
          <textarea name="fleet_description" rows={3} value={form.fleet_description} onChange={handleChange}
            placeholder="Mostly 3–7 year automatic diesels. Economy, mid-size sedans and SUVs."
            className={inputCls} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Transmission" hint="e.g. Automatic, Manual, Mixed">
            <input type="text" name="transmission_mix" value={form.transmission_mix}
              onChange={handleChange} placeholder="Automatic" className={inputCls} />
          </Field>
          <Field label="Fuel" hint="e.g. Diesel, Petrol, Electric, Mixed">
            <input type="text" name="fuel_mix" value={form.fuel_mix}
              onChange={handleChange} placeholder="Diesel" className={inputCls} />
          </Field>
          <Field label="Age range" hint="e.g. 2019–2024">
            <input type="text" name="age_range" value={form.age_range}
              onChange={handleChange} placeholder="2019–2024" className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Amenities */}
      <Section title="Services & amenities">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(AMENITY_LABELS).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-slate-50 px-3 py-2.5 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={amenities[key] ?? false}
                onChange={(e) => handleAmenity(key, e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-neutral-700">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact details">
        <Field label="Phone" hint="Include country code, e.g. +371 2012 3456">
          <input type="tel" name="phone" value={form.phone} onChange={handleChange}
            placeholder="+371 2012 3456" className={inputCls} />
        </Field>
        <Field label="WhatsApp" hint="Leave blank if same as phone or not used">
          <input type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange}
            placeholder="+371 2012 3456" className={inputCls} />
        </Field>
        <Field label="Email">
          <input type="email" name="email" value={form.email} onChange={handleChange}
            placeholder="rentals@example.com" className={inputCls} />
        </Field>
        <Field label="Website" hint="Include https://">
          <input type="url" name="website" value={form.website} onChange={handleChange}
            placeholder="https://example.com" className={inputCls} />
        </Field>
      </Section>

      {/* Location */}
      <Section title="Location">
        <Field label="Office / pickup address">
          <input type="text" name="address" value={form.address} onChange={handleChange}
            placeholder="Brivibas iela 123, Riga" className={inputCls} />
        </Field>
      </Section>

      {/* Submit */}
      <div className="flex items-center gap-4 pb-10">
        <button type="submit" disabled={status === "saving"}
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Saved
          </span>
        )}
        {status === "error" && (
          <span className="text-sm text-red-600">{errorMsg || "Save failed. Please try again."}</span>
        )}
      </div>
    </form>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      {hint && <p className="mb-2 text-xs text-neutral-400">{hint}</p>}
      {children}
    </div>
  );
}
