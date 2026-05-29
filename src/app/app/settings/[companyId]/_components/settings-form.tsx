"use client";

import { useState, useEffect } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

/* ── localStorage time format (per-browser) ─────────────────────────── */

function storageKey(companyId: string) { return `crd-settings-${companyId}`; }

interface LocalSettings { timeFormat: "12h" | "24h"; }

function loadLocal(companyId: string): LocalSettings {
  if (typeof window === "undefined") return { timeFormat: "24h" };
  try { return { timeFormat: "24h", ...JSON.parse(localStorage.getItem(storageKey(companyId)) ?? "{}") }; }
  catch { return { timeFormat: "24h" }; }
}

/* ── Invoice settings shape ─────────────────────────────────────────── */

interface InvoiceDefaults {
  invoice_legal_name:    string | null;
  invoice_reg_number:    string | null;
  invoice_vat_number:    string | null;
  invoice_address:       string | null;
  invoice_bank_name:     string | null;
  invoice_iban:          string | null;
  invoice_swift:         string | null;
  invoice_default_vat:   number | null;
  invoice_prefix:        string | null;
  invoice_payment_terms: string | null;
  invoice_footer_notes:  string | null;
}

interface Props {
  companyId: string;
  invoiceDefaults: InvoiceDefaults;
}

/* ── Component ──────────────────────────────────────────────────────── */

export function SettingsForm({ companyId, invoiceDefaults }: Props) {
  const [local, setLocal] = useState<LocalSettings>({ timeFormat: "24h" });
  const [localSaved, setLocalSaved] = useState(false);

  const [inv, setInv] = useState({
    invoice_legal_name:    invoiceDefaults.invoice_legal_name    ?? "",
    invoice_reg_number:    invoiceDefaults.invoice_reg_number    ?? "",
    invoice_vat_number:    invoiceDefaults.invoice_vat_number    ?? "",
    invoice_address:       invoiceDefaults.invoice_address       ?? "",
    invoice_bank_name:     invoiceDefaults.invoice_bank_name     ?? "",
    invoice_iban:          invoiceDefaults.invoice_iban          ?? "",
    invoice_swift:         invoiceDefaults.invoice_swift         ?? "",
    invoice_default_vat:   String(invoiceDefaults.invoice_default_vat ?? 21),
    invoice_prefix:        invoiceDefaults.invoice_prefix        ?? "INV",
    invoice_payment_terms: invoiceDefaults.invoice_payment_terms ?? "Due on receipt",
    invoice_footer_notes:  invoiceDefaults.invoice_footer_notes  ?? "",
  });
  const [invStatus, setInvStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [invError, setInvError] = useState("");

  useEffect(() => { setLocal(loadLocal(companyId)); }, [companyId]);

  function setInvField(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setInv((p) => ({ ...p, [e.target.name]: e.target.value }));
    setInvStatus("idle");
  }

  function handleLocalSave() {
    localStorage.setItem(storageKey(companyId), JSON.stringify(local));
    setLocalSaved(true);
    setTimeout(() => setLocalSaved(false), 2000);
  }

  async function handleInvSave(e: React.FormEvent) {
    e.preventDefault();
    setInvStatus("saving");
    setInvError("");
    try {
      const supabase = getAuthBrowserClient();
      const { error } = await supabase.from("companies").update({
        invoice_legal_name:    inv.invoice_legal_name    || null,
        invoice_reg_number:    inv.invoice_reg_number    || null,
        invoice_vat_number:    inv.invoice_vat_number    || null,
        invoice_address:       inv.invoice_address       || null,
        invoice_bank_name:     inv.invoice_bank_name     || null,
        invoice_iban:          inv.invoice_iban          || null,
        invoice_swift:         inv.invoice_swift         || null,
        invoice_default_vat:   parseFloat(inv.invoice_default_vat) || 21,
        invoice_prefix:        inv.invoice_prefix        || "INV",
        invoice_payment_terms: inv.invoice_payment_terms || "Due on receipt",
        invoice_footer_notes:  inv.invoice_footer_notes  || null,
      }).eq("id", companyId);
      if (error) throw error;
      setInvStatus("saved");
      setTimeout(() => setInvStatus("idle"), 2500);
    } catch (err: unknown) {
      setInvError(err instanceof Error ? err.message : "Save failed");
      setInvStatus("error");
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Time format ── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-neutral-900">Time format</h2>
        <p className="mb-5 text-sm text-neutral-500">
          Controls how times are displayed in booking forms and the calendar.
        </p>
        <div className="flex gap-3">
          {(["24h", "12h"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => { setLocal((p) => ({ ...p, timeFormat: fmt })); setLocalSaved(false); }}
              className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                local.timeFormat === fmt
                  ? "border-brand-700 bg-brand-50 text-brand-700"
                  : "border-border text-neutral-500 hover:bg-slate-50"
              }`}
            >
              {fmt === "24h" ? "24-hour (13:00)" : "12-hour (1:00 PM)"}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-400">Settings are saved per browser.</p>
        <button
          type="button"
          onClick={handleLocalSave}
          className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          {localSaved ? "Saved ✓" : "Save display settings"}
        </button>
      </div>

      {/* ── Date format note ── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-neutral-900">Date format</h2>
        <p className="text-sm text-neutral-500">
          All dates are displayed as <strong>DD/MM/YYYY</strong> throughout the platform.
        </p>
      </div>

      {/* ── Invoice settings ── */}
      <form onSubmit={handleInvSave} className="rounded-2xl border border-border bg-white p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Invoice settings</h2>
          <p className="mt-1 text-sm text-neutral-500">
            These details appear on every PDF invoice you generate.
          </p>
        </div>

        {/* Legal info */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Company legal info</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Legal company name" name="invoice_legal_name" value={inv.invoice_legal_name} onChange={setInvField} placeholder="SIA Baltic Car Rent" />
            <Field label="Registration number" name="invoice_reg_number" value={inv.invoice_reg_number} onChange={setInvField} placeholder="LV40003123456" />
            <Field label="VAT number" name="invoice_vat_number" value={inv.invoice_vat_number} onChange={setInvField} placeholder="LV40003123456" />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Legal address</label>
              <textarea
                name="invoice_address"
                value={inv.invoice_address}
                onChange={setInvField}
                rows={2}
                placeholder="Brīvības iela 1, Rīga, LV-1010, Latvia"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Banking */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Banking details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank name" name="invoice_bank_name" value={inv.invoice_bank_name} onChange={setInvField} placeholder="SEB banka" />
            <Field label="IBAN" name="invoice_iban" value={inv.invoice_iban} onChange={setInvField} placeholder="LV12HABAL0000000000" />
            <Field label="SWIFT / BIC" name="invoice_swift" value={inv.invoice_swift} onChange={setInvField} placeholder="HABALV22" />
          </div>
        </div>

        {/* Invoice defaults */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Invoice defaults</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Invoice number prefix" name="invoice_prefix" value={inv.invoice_prefix} onChange={setInvField} placeholder="INV" helper="e.g. INV → INV-001, INV-002…" />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Default VAT rate (%)</label>
              <input
                type="number"
                name="invoice_default_vat"
                value={inv.invoice_default_vat}
                onChange={setInvField}
                min={0} max={100} step={0.5}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Payment terms</label>
              <select
                name="invoice_payment_terms"
                value={inv.invoice_payment_terms}
                onChange={setInvField}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option>Due on receipt</option>
                <option>Net 7</option>
                <option>Net 14</option>
                <option>Net 30</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Invoice footer / notes</label>
              <textarea
                name="invoice_footer_notes"
                value={inv.invoice_footer_notes}
                onChange={setInvField}
                rows={2}
                placeholder="Thank you for your business. Late payments subject to 0.5% monthly interest."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {invError && <p className="text-sm text-red-600">{invError}</p>}

        <button
          type="submit"
          disabled={invStatus === "saving"}
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {invStatus === "saving" ? "Saving…" : invStatus === "saved" ? "Saved ✓" : "Save invoice settings"}
        </button>
      </form>

    </div>
  );
}

function Field({
  label, name, value, onChange, placeholder, helper,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; helper?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {helper && <p className="mt-1 text-xs text-neutral-400">{helper}</p>}
    </div>
  );
}
