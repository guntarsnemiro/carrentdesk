"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { DateInput } from "@/components/ui/date-input";
import { submitGlobalBlacklistReport } from "@/app/actions/blacklist";
import { REASON_LABELS } from "@/lib/blacklist-shared";

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
  customer_type?: string | null;
  company_name?: string | null;
  company_reg_number?: string | null;
  company_vat_number?: string | null;
  billing_address?: string | null;
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
    customer_type:          (customer?.customer_type ?? "person") as "person" | "company",
    company_name:           customer?.company_name ?? "",
    company_reg_number:     customer?.company_reg_number ?? "",
    company_vat_number:     customer?.company_vat_number ?? "",
    billing_address:        customer?.billing_address ?? "",
  });

  const [status, setStatus] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Global blacklist report (only shown when blacklisting an existing customer)
  const [globalReport, setGlobalReport] = useState({
    enabled:         false,
    reason_category: "property_damage",
    severity:        2,
    country:         "",
    notes_public:    "",
  });
  const [globalStatus, setGlobalStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [globalError, setGlobalError] = useState("");

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
    const isCompany = form.customer_type === "company";
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
      customer_type:          form.customer_type,
      company_name:           isCompany ? (form.company_name.trim() || null) : null,
      company_reg_number:     isCompany ? (form.company_reg_number.trim() || null) : null,
      company_vat_number:     isCompany ? (form.company_vat_number.trim() || null) : null,
      billing_address:        form.billing_address.trim() || null,
      updated_at:             new Date().toISOString(),
    };

    const { error } = isEdit
      ? await supabase.from("customers").update(payload).eq("id", customer!.id)
      : await supabase.from("customers").insert(payload);

    if (error) { setStatus("error"); setErrorMsg(error.message); return; }

    // Submit global blacklist report if requested
    if (isEdit && customer && form.blacklisted && globalReport.enabled) {
      setGlobalStatus("sending");
      const result = await submitGlobalBlacklistReport({
        companyId,
        customerId: customer.id,
        idNumber:      form.id_number.trim() || null,
        licenseNumber: form.driver_license_number.trim() || null,
        reasonCategory: globalReport.reason_category,
        severity:       globalReport.severity,
        country:        globalReport.country,
        notesPublic:    globalReport.notes_public,
      });
      if (!result.ok) {
        setGlobalError(result.error);
        setGlobalStatus("error");
      } else {
        setGlobalStatus("sent");
      }
    }

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

      {/* ── Customer type ── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Customer type</h2>
        <div className="flex gap-3">
          {(["person", "company"] as const).map((t) => (
            <button key={t} type="button"
              onClick={() => setForm((p) => ({ ...p, customer_type: t }))}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                form.customer_type === t
                  ? "border-brand-700 bg-brand-50 text-brand-700"
                  : "border-border text-neutral-500 hover:bg-slate-50"
              }`}>
              {t === "person" ? "👤 Private person" : "🏢 Company"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Company B2B fields ── */}
      {form.customer_type === "company" && (
        <Section title="Company details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company name *">
              <input name="company_name" required value={form.company_name} onChange={set}
                placeholder="SIA Example Company" className={inp} />
            </Field>
            <Field label="Registration number *">
              <input name="company_reg_number" required value={form.company_reg_number} onChange={set}
                placeholder="LV40003123456" className={`${inp} font-mono`} />
            </Field>
            <Field label="VAT number">
              <input name="company_vat_number" value={form.company_vat_number} onChange={set}
                placeholder="LV40003123456" className={`${inp} font-mono`} />
            </Field>
            <Field label="Billing address">
              <input name="billing_address" value={form.billing_address} onChange={set}
                placeholder="Street, City, Country" className={inp} />
            </Field>
          </div>
        </Section>
      )}

      {/* ── Identity ── */}
      <Section title={form.customer_type === "company" ? "Contact person" : "Customer details"}>
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
            Flag this customer as blacklisted (your company only)
          </span>
        </label>
        {form.blacklisted && (
          <div className="mt-3 space-y-4">
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              This customer will trigger a warning when selected in a new booking.
            </div>
            <Field label="Internal reason">
              <input name="blacklist_reason" value={form.blacklist_reason} onChange={set}
                placeholder="e.g. Returned car with unreported damage, refused to pay"
                className={inp} />
            </Field>

            {/* Global network report — only for existing customers with a document on file */}
            {isEdit && (form.id_number || form.driver_license_number) && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={globalReport.enabled}
                    onChange={(e) => setGlobalReport((p) => ({ ...p, enabled: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-border text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-orange-800">
                      Also report to CarRentDesk global blacklist
                    </span>
                    <p className="mt-0.5 text-xs text-orange-700">
                      Document numbers are hashed — no personal data is shared. Other rental companies will see a warning but not the customer's identity.
                      Report goes to admin for approval before it becomes visible.
                    </p>
                  </div>
                </label>

                {globalReport.enabled && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-orange-800 mb-1">Reason category *</label>
                        <select
                          value={globalReport.reason_category}
                          onChange={(e) => setGlobalReport((p) => ({ ...p, reason_category: e.target.value }))}
                          className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                          {Object.entries(REASON_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-orange-800 mb-1">Severity *</label>
                        <select
                          value={globalReport.severity}
                          onChange={(e) => setGlobalReport((p) => ({ ...p, severity: Number(e.target.value) }))}
                          className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        >
                          <option value={1}>1 — Minor</option>
                          <option value={2}>2 — Serious</option>
                          <option value={3}>3 — Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-orange-800 mb-1">Country where incident happened</label>
                        <input
                          type="text"
                          value={globalReport.country}
                          onChange={(e) => setGlobalReport((p) => ({ ...p, country: e.target.value }))}
                          placeholder="LV, EE, LT…"
                          className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-orange-800 mb-1">Public note (no names, no document numbers)</label>
                      <textarea
                        value={globalReport.notes_public}
                        onChange={(e) => setGlobalReport((p) => ({ ...p, notes_public: e.target.value }))}
                        rows={2}
                        placeholder="e.g. Vehicle returned with serious undisclosed damage to undercarriage. Police report filed."
                        className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    {globalStatus === "error" && (
                      <p className="text-xs text-red-600">{globalError}</p>
                    )}
                    {globalStatus === "sent" && (
                      <p className="text-xs text-green-700">✓ Report submitted — pending admin review.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {isEdit && !form.id_number && !form.driver_license_number && (
              <p className="text-xs text-neutral-400">
                To report to the global network, add an ID or driver&apos;s license number to this customer's profile first.
              </p>
            )}
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
