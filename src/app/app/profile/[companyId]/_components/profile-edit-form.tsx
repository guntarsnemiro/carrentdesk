"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  status: string;
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

interface Props {
  company: Company;
  location: Location | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function ProfileEditForm({ company, location }: Props) {
  const [form, setForm] = useState({
    description: company.description ?? "",
    phone: company.phone ?? "",
    whatsapp: company.whatsapp ?? "",
    website: company.website ?? "",
    email: company.email ?? "",
    founded_year: company.founded_year ? String(company.founded_year) : "",
    address: location?.address ?? "",
  });
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === "saved" || status === "error") setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const supabase = getAuthBrowserClient();

    // Update companies table
    const { error: companyError } = await supabase
      .from("companies")
      .update({
        description: form.description || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        website: form.website || null,
        email: form.email || null,
        founded_year: form.founded_year ? parseInt(form.founded_year, 10) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", company.id);

    if (companyError) {
      setStatus("error");
      setErrorMsg(companyError.message);
      return;
    }

    // Update or insert primary location
    if (form.address) {
      if (location) {
        await supabase
          .from("locations")
          .update({ address: form.address })
          .eq("id", location.id);
      } else {
        await supabase.from("locations").insert({
          company_id: company.id,
          address: form.address,
          is_primary: true,
        });
      }
    }

    setStatus("saved");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* About */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">About your company</h2>
        <div className="space-y-4">
          <Field label="Description" hint="Shown on your public profile. Keep it concise — 2-4 sentences.">
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="We are an independent car rental company in Riga with 15 years of experience…"
              className={inputCls}
            />
          </Field>
          <Field label="Founded year" hint="e.g. 2008">
            <input
              type="number"
              name="founded_year"
              min={1900}
              max={new Date().getFullYear()}
              value={form.founded_year}
              onChange={handleChange}
              placeholder="2008"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Contact details</h2>
        <div className="space-y-4">
          <Field label="Phone number" hint="Include country code, e.g. +371 2012 3456">
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+371 2012 3456"
              className={inputCls}
            />
          </Field>
          <Field label="WhatsApp number" hint="Leave blank if same as phone or not used">
            <input
              type="tel"
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              placeholder="+371 2012 3456"
              className={inputCls}
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="rentals@example.com"
              className={inputCls}
            />
          </Field>
          <Field label="Website" hint="Include https://">
            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://example.com"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Location */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Location</h2>
        <Field label="Office / pickup address" hint="Street address shown on your public profile">
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Brivibas iela 123, Riga"
            className={inputCls}
          />
        </Field>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
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

const inputCls =
  "w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      {hint && <p className="mb-2 text-xs text-neutral-400">{hint}</p>}
      {children}
    </div>
  );
}
