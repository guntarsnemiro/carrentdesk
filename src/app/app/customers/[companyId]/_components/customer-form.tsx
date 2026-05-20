"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { DateInput } from "@/components/ui/date-input";

type Language = "en" | "lv" | "ru" | "other";

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  language: Language | string | null;
  address: string | null;
  date_of_birth: string | null;
  id_number: string | null;
  id_expiry: string | null;
  driver_license_number: string | null;
  driver_license_expiry: string | null;
  blacklisted: boolean;
  blacklist_reason: string | null;
  notes: string | null;
}

interface Props { companyId: string; customer?: Customer; }

export function CustomerForm({ companyId, customer }: Props) {
  const router = useRouter();
  const isEdit = Boolean(customer);

  const [form, setForm] = useState({
    full_name:              customer?.full_name ?? "",
    phone:                  customer?.phone ?? "",
    email:                  customer?.email ?? "",
    language:               (customer?.language ?? "") as Language | "",
    address:                customer?.address ?? "",
    date_of_birth:          customer?.date_of_birth ?? "",
    id_number:              customer?.id_number ?? "",
    id_expiry:              customer?.id_expiry ?? "",
    driver_license_number:  customer?.driver_license_number ?? "",
    driver_license_expiry:  customer?.driver_license_expiry ?? "",
    blacklisted:            customer?.blacklisted ?? false,
    blacklist_reason:       customer?.blacklist_reason ?? "",
    notes:                  customer?.notes ?? "",
  });

  const [status, setStatus] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value;
    setForm((p) => ({ ...p, phone: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const phone = form.phone.trim();
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length > 0 && digitsOnly.length < 7) {
      setErrorMsg("Phone number seems too short — please check it.");
      setStatus("error");
      return;
    }

    const supabase = getAuthBrowserClient();
    const payload = {
      company_id:             companyId,
      full_name:              form.full_name.trim(),
      phone:                  phone,
      email:                  form.email.trim() || null,
      language:               (form.language || null) as Language | null,
      address:                form.address.trim() || null,
      date_of_birth:          form.date_of_birth || null,
      id_number:              form.id_number.trim() || null,
      id_expiry:              form.id_expiry || null,
      driver_license_number:  form.driver_license_number.trim() || null,
      driver_license_expiry:  form.driver_license_expiry || null,
      blacklisted:            form.blacklisted,
      blacklist_reason:       form.blacklisted ? (form.blacklist_reason.trim() || null) : null,
      notes:                  form.notes.trim() || null,
      updated_at:             new Date().toISOString(),
    };

    const { error } = isEdit
      ? await supabase.from("customers").update(payload).eq("id", customer!.id)
      : await supabase.from("customers").insert(payload);

    if (error) { setStatus("error"); setErrorMsg(error.message); return; }
    router.push(`/app/customers/${companyId}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!customer || !confirm(`Delete ${customer.full_name}? This cannot be undone.`)) return;
    setStatus("deleting");
    await getAuthBrowserClient().from("customers").delete().eq("id", customer.id);
    router.push(`/app/customers/${companyId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Identity ── */}
      <Section title="Customer details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <input name="full_name" required value={form.full_name} onChange={set}
              placeholder="John Smith" className={inp} />
          </Field>
          <Field label="Phone * (with country code)">
            <input name="phone" required value={form.phone} onChange={handlePhoneChange}
              placeholder="e.g. +371 12345678" className={inp} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input name="email" type="email" value={form.email} onChange={set}
              placeholder="john@example.com" className={inp} />
          </Field>
          <Field label="Language preference">
            <select name="language" value={form.language} onChange={set} className={inp}>
              <option value="">Not specified</option>
              <option value="en">English</option>
              <option value="lv">Latvian</option>
              <option value="ru">Russian</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
        <Field label="Address">
          <input name="address" value={form.address} onChange={set}
            placeholder="Street, City, Country" className={inp} />
        </Field>
        <Field label="Date of birth" hint="DD.MM.YYYY">
          <DateInput value={form.date_of_birth} onChange={(v) => setForm((p) => ({ ...p, date_of_birth: v }))} className={inp} />
        </Field>
      </Section>

      {/* ── Documents ── */}
      <Section title="Identity documents">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ID / Passport number">
            <input name="id_number" value={form.id_number} onChange={set}
              placeholder="PA1234567" className={`${inp} font-mono`} />
          </Field>
          <Field label="ID expiry date" hint="DD.MM.YYYY">
            <DateInput value={form.id_expiry} onChange={(v) => setForm((p) => ({ ...p, id_expiry: v }))} className={inp} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Driver license number">
            <input name="driver_license_number" value={form.driver_license_number} onChange={set}
              placeholder="LV12345678" className={`${inp} font-mono`} />
          </Field>
          <Field label="Driver license expiry" hint="DD.MM.YYYY">
            <DateInput value={form.driver_license_expiry} onChange={(v) => setForm((p) => ({ ...p, driver_license_expiry: v }))} className={inp} />
          </Field>
        </div>
      </Section>

      {/* ── Internal notes ── */}
      <Section title="Internal notes">
        <Field label="Notes">
          <textarea name="notes" rows={3} value={form.notes} onChange={set}
            placeholder="Preferences, history, anything the team should know…"
            className={inp} />
        </Field>
      </Section>

      {/* ── Blacklist ── */}
      <Section title="Blacklist">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="blacklisted" checked={form.blacklisted} onChange={set}
            className="h-4 w-4 rounded border-border text-red-600 focus:ring-red-500" />
          <span className="text-sm font-medium text-neutral-700">
            Flag this customer as blacklisted
          </span>
        </label>
        {form.blacklisted && (
          <div className="mt-3">
            <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              This customer will trigger a warning when selected in a new booking.
            </div>
            <Field label="Reason for blacklisting">
              <input name="blacklist_reason" value={form.blacklist_reason} onChange={set}
                placeholder="e.g. Returned car with unreported damage, refused to pay"
                className={inp} />
            </Field>
          </div>
        )}
      </Section>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      )}

      <div className="flex items-center justify-between pb-10">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={status === "saving" || status === "deleting"}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {status === "saving" ? "Saving…" : isEdit ? "Save changes" : "Add customer"}
          </button>
          <a href={`/app/customers/${companyId}`}
            className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
            Cancel
          </a>
        </div>
        {isEdit && (
          <button type="button" onClick={handleDelete}
            disabled={status === "deleting" || status === "saving"}
            className="text-sm text-red-500 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-50">
            {status === "deleting" ? "Deleting…" : "Delete customer"}
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
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
