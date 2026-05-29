"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

/* ── Types ─────────────────────────────────────────────────────────── */

export interface InvoiceItem {
  id?: string;
  sort_order: number;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
}

export interface InvoiceData {
  id?: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  seller_name: string;
  seller_reg_number: string;
  seller_vat_number: string;
  seller_address: string;
  seller_bank_name: string;
  seller_iban: string;
  seller_swift: string;
  buyer_type: "person" | "company";
  buyer_name: string;
  buyer_reg_number: string;
  buyer_vat_number: string;
  buyer_address: string;
  buyer_email: string;
  payment_terms: string;
  notes: string;
  currency: string;
}

interface CustomerOption {
  id: string;
  full_name: string;
  email: string | null;
  customer_type?: string | null;
  company_name?: string | null;
  company_reg_number?: string | null;
  company_vat_number?: string | null;
  billing_address?: string | null;
  address?: string | null;
}

interface Props {
  companyId: string;
  invoice?: InvoiceData;
  items?: InvoiceItem[];
  defaultVat?: number;
  customers?: CustomerOption[];
  bookingId?: string;
}

/* ── Buyer search combobox ──────────────────────────────────────────── */

function BuyerSearch({
  companyId,
  customers,
  buyerName,
  buyerType,
  onSelect,
  onChange,
}: {
  companyId: string;
  customers: CustomerOption[];
  buyerName: string;
  buyerType: "person" | "company";
  onSelect: (c: CustomerOption) => void;
  onChange: (val: string) => void;
}) {
  const [query, setQuery] = useState(buyerName);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Keep local query in sync when parent resets
  useEffect(() => { setQuery(buyerName); }, [buyerName]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim().length === 0 ? [] : customers.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.company_name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  }).slice(0, 8);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
  }

  function pick(c: CustomerOption) {
    const isCompany = c.customer_type === "company";
    const displayName = isCompany ? (c.company_name ?? c.full_name) : c.full_name;
    setQuery(displayName);
    setOpen(false);
    onSelect(c);
  }

  const createUrl = `/app/customers/${companyId}/add`;

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => query.trim().length > 0 && setOpen(true)}
        placeholder={buyerType === "company" ? "Search company name…" : "Search customer name…"}
        className={inp}
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {filtered.length > 0 ? (
            <ul>
              {filtered.map((c) => {
                const isCompany = c.customer_type === "company";
                const label = isCompany ? (c.company_name ?? c.full_name) : c.full_name;
                const sub = isCompany ? c.full_name : c.email;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={() => pick(c)}
                      className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-neutral-50"
                    >
                      <span className="text-sm font-medium text-neutral-900">{label}</span>
                      {sub && <span className="text-xs text-neutral-400">{sub}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">No customers found.</div>
          )}
          <div className="border-t border-border px-4 py-2.5">
            <a
              href={createUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              + Create new customer
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────── */

export function InvoiceEditor({ companyId, invoice, items: initItems, defaultVat = 21, customers = [], bookingId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(invoice?.id);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<InvoiceData>({
    invoice_number:    invoice?.invoice_number    ?? "",
    status:            invoice?.status            ?? "draft",
    issue_date:        invoice?.issue_date        ?? today,
    due_date:          invoice?.due_date          ?? "",
    seller_name:       invoice?.seller_name       ?? "",
    seller_reg_number: invoice?.seller_reg_number ?? "",
    seller_vat_number: invoice?.seller_vat_number ?? "",
    seller_address:    invoice?.seller_address    ?? "",
    seller_bank_name:  invoice?.seller_bank_name  ?? "",
    seller_iban:       invoice?.seller_iban       ?? "",
    seller_swift:      invoice?.seller_swift      ?? "",
    buyer_type:        invoice?.buyer_type        ?? "person",
    buyer_name:        invoice?.buyer_name        ?? "",
    buyer_reg_number:  invoice?.buyer_reg_number  ?? "",
    buyer_vat_number:  invoice?.buyer_vat_number  ?? "",
    buyer_address:     invoice?.buyer_address     ?? "",
    buyer_email:       invoice?.buyer_email       ?? "",
    payment_terms:     invoice?.payment_terms     ?? "Due on receipt",
    notes:             invoice?.notes             ?? "",
    currency:          invoice?.currency          ?? "EUR",
  });

  const [lineItems, setLineItems] = useState<InvoiceItem[]>(
    initItems && initItems.length > 0 ? initItems : [
      { sort_order: 0, description: "", quantity: 1, unit_price: 0, vat_rate: defaultVat, line_total: 0 },
    ]
  );

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /* ── Derived totals ── */
  const subtotal   = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vatAmount  = lineItems.reduce((s, i) => s + i.quantity * i.unit_price * i.vat_rate / 100, 0);
  const total      = subtotal + vatAmount;

  /* ── Handlers ── */

  function setField(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function setItemField(idx: number, field: keyof InvoiceItem, raw: string) {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx] };
      if (field === "description") {
        item.description = raw;
      } else {
        (item as Record<string, number | string>)[field] = parseFloat(raw) || 0;
      }
      item.line_total = item.quantity * item.unit_price;
      next[idx] = item;
      return next;
    });
  }

  function addItem() {
    setLineItems((p) => [...p, { sort_order: p.length, description: "", quantity: 1, unit_price: 0, vat_rate: defaultVat, line_total: 0 }]);
  }

  function removeItem(idx: number) {
    setLineItems((p) => p.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sort_order: i })));
  }

  function fillFromCustomer(c: CustomerOption) {
    const isCompany = c.customer_type === "company";
    setForm((p) => ({
      ...p,
      buyer_type:        isCompany ? "company" : "person",
      buyer_name:        isCompany ? (c.company_name ?? c.full_name) : c.full_name,
      buyer_reg_number:  isCompany ? (c.company_reg_number ?? "") : "",
      buyer_vat_number:  isCompany ? (c.company_vat_number ?? "") : "",
      buyer_address:     c.billing_address ?? c.address ?? "",
      buyer_email:       c.email ?? "",
    }));
  }

  const buildPayload = useCallback(() => ({
    company_id:        companyId,
    booking_id:        bookingId ?? null,
    invoice_number:    form.invoice_number,
    status:            form.status,
    issue_date:        form.issue_date,
    due_date:          form.due_date || null,
    seller_name:       form.seller_name,
    seller_reg_number: form.seller_reg_number || null,
    seller_vat_number: form.seller_vat_number || null,
    seller_address:    form.seller_address || null,
    seller_bank_name:  form.seller_bank_name || null,
    seller_iban:       form.seller_iban || null,
    seller_swift:      form.seller_swift || null,
    buyer_type:        form.buyer_type,
    buyer_name:        form.buyer_name,
    buyer_reg_number:  form.buyer_reg_number || null,
    buyer_vat_number:  form.buyer_vat_number || null,
    buyer_address:     form.buyer_address || null,
    buyer_email:       form.buyer_email || null,
    payment_terms:     form.payment_terms || null,
    notes:             form.notes || null,
    currency:          form.currency,
    subtotal:          Math.round(subtotal * 100) / 100,
    vat_amount:        Math.round(vatAmount * 100) / 100,
    total:             Math.round(total * 100) / 100,
    updated_at:        new Date().toISOString(),
  }), [form, subtotal, vatAmount, total, companyId, bookingId]);

  async function save(extraStatus?: string) {
    if (!form.invoice_number.trim()) { setError("Invoice number is required"); return null; }
    if (!form.buyer_name.trim())     { setError("Buyer name is required"); return null; }
    if (form.buyer_type === "company" && !form.buyer_reg_number.trim()) {
      setError("Company registration number is required for company invoices"); return null;
    }
    setError("");

    const supabase = getAuthBrowserClient();
    const payload = { ...buildPayload(), ...(extraStatus ? { status: extraStatus } : {}) };

    if (isEdit && invoice?.id) {
      const invId = invoice.id;
      const { error: err } = await supabase.from("invoices").update(payload).eq("id", invId);
      if (err) throw err;
      await supabase.from("invoice_items").delete().eq("invoice_id", invId);
      if (lineItems.length) {
        await supabase.from("invoice_items").insert(
          lineItems.map((it, i) => ({ description: it.description, quantity: it.quantity, unit_price: it.unit_price, vat_rate: it.vat_rate, line_total: it.line_total, invoice_id: invId, sort_order: i }))
        );
      }
      return invId;
    } else {
      const { data, error: err } = await supabase.from("invoices").insert(payload).select("id").single();
      if (err) throw err;
      if (lineItems.length) {
        await supabase.from("invoice_items").insert(
          lineItems.map((it, i) => ({ description: it.description, quantity: it.quantity, unit_price: it.unit_price, vat_rate: it.vat_rate, line_total: it.line_total, invoice_id: data.id, sort_order: i }))
        );
      }
      return data.id;
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const id = await save();
      if (!id) return;
      router.push(`/app/invoices/${companyId}/${id}`);
      router.refresh();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleSendEmail() {
    setSending(true);
    try {
      const id = await save("sent");
      if (!id) return;
      const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Send failed");
      }
      router.push(`/app/invoices/${companyId}/${id}`);
      router.refresh();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Send failed"); }
    finally { setSending(false); }
  }

  /* ── Render ── */

  return (
    <div className="space-y-6 pb-16">

      {/* Invoice header fields */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Invoice details</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Invoice number *">
            <input name="invoice_number" required value={form.invoice_number} onChange={setField}
              placeholder="INV-001" className={inp} />
          </Field>
          <Field label="Issue date">
            <input type="date" name="issue_date" value={form.issue_date} onChange={setField} className={inp} />
          </Field>
          <Field label="Due date">
            <input type="date" name="due_date" value={form.due_date} onChange={setField} className={inp} />
          </Field>
          <Field label="Payment terms">
            <select name="payment_terms" value={form.payment_terms} onChange={setField} className={inp}>
              <option>Due on receipt</option>
              <option>Net 7</option>
              <option>Net 14</option>
              <option>Net 30</option>
            </select>
          </Field>
          <Field label="Currency">
            <select name="currency" value={form.currency} onChange={setField} className={inp}>
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="GBP">GBP £</option>
            </select>
          </Field>
          {isEdit && (
            <Field label="Status">
              <select name="status" value={form.status} onChange={setField} className={inp}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          )}
        </div>
      </div>

      {/* Seller block */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">From (seller)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name *">
            <input name="seller_name" required value={form.seller_name} onChange={setField} placeholder="SIA Baltic Car Rent" className={inp} />
          </Field>
          <Field label="Registration number">
            <input name="seller_reg_number" value={form.seller_reg_number} onChange={setField} placeholder="LV40003123456" className={`${inp} font-mono`} />
          </Field>
          <Field label="VAT number">
            <input name="seller_vat_number" value={form.seller_vat_number} onChange={setField} placeholder="LV40003123456" className={`${inp} font-mono`} />
          </Field>
          <Field label="Bank name">
            <input name="seller_bank_name" value={form.seller_bank_name} onChange={setField} placeholder="SEB banka" className={inp} />
          </Field>
          <Field label="IBAN">
            <input name="seller_iban" value={form.seller_iban} onChange={setField} placeholder="LV12HABAL0000000000" className={`${inp} font-mono`} />
          </Field>
          <Field label="SWIFT / BIC">
            <input name="seller_swift" value={form.seller_swift} onChange={setField} placeholder="HABALV22" className={`${inp} font-mono`} />
          </Field>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Legal address</label>
            <textarea name="seller_address" value={form.seller_address} onChange={setField} rows={2}
              placeholder="Brīvības iela 1, Rīga, LV-1010, Latvia"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
      </div>

      {/* Buyer block */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">To (buyer)</h2>

        {/* Type toggle */}
        <div className="mb-4 flex gap-3">
          {(["person", "company"] as const).map((t) => (
            <button key={t} type="button"
              onClick={() => setForm((p) => ({ ...p, buyer_type: t }))}
              className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
                form.buyer_type === t
                  ? "border-brand-700 bg-brand-50 text-brand-700"
                  : "border-border text-neutral-500 hover:bg-slate-50"
              }`}>
              {t === "person" ? "👤 Private person" : "🏢 Company"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Searchable buyer name — single field, searches customers */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {form.buyer_type === "company" ? "Company name *" : "Full name *"}
              <span className="ml-1 font-normal text-neutral-400 text-xs">— type to search existing customers</span>
            </label>
            <BuyerSearch
              companyId={companyId}
              customers={customers}
              buyerName={form.buyer_name}
              buyerType={form.buyer_type}
              onSelect={fillFromCustomer}
              onChange={(v) => setForm((p) => ({ ...p, buyer_name: v }))}
            />
          </div>

          {form.buyer_type === "company" && (
            <>
              <Field label="Registration number *">
                <input name="buyer_reg_number" required value={form.buyer_reg_number} onChange={setField}
                  placeholder="LV40003123456" className={`${inp} font-mono`} />
              </Field>
              <Field label="VAT number">
                <input name="buyer_vat_number" value={form.buyer_vat_number} onChange={setField}
                  placeholder="LV40003123456" className={`${inp} font-mono`} />
              </Field>
            </>
          )}

          <Field label="Email">
            <input name="buyer_email" type="email" value={form.buyer_email} onChange={setField}
              placeholder="customer@example.com" className={inp} />
          </Field>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {form.buyer_type === "company" ? "Billing address" : "Address"}
            </label>
            <textarea name="buyer_address" value={form.buyer_address} onChange={setField} rows={2}
              placeholder="Street, City, Country"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Line items</h2>
        <div className="space-y-3">
          <div className="hidden grid-cols-[1fr_80px_100px_80px_100px_32px] gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 sm:grid">
            <span>Description</span>
            <span className="text-center">Qty</span>
            <span className="text-center">Unit price</span>
            <span className="text-center">VAT %</span>
            <span className="text-right">Line total</span>
            <span></span>
          </div>
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_80px_100px_80px_100px_32px] sm:items-center">
              <input
                value={item.description} onChange={(e) => setItemField(idx, "description", e.target.value)}
                placeholder="e.g. Car rental — Volvo S60 (5 days)"
                className={`${inp} col-span-1`}
              />
              <input type="number" min={0} step="0.001"
                value={item.quantity} onChange={(e) => setItemField(idx, "quantity", e.target.value)}
                className={`${inp} text-center sm:w-full`} title="Quantity"
              />
              <input type="number" min={0} step="0.01"
                value={item.unit_price} onChange={(e) => setItemField(idx, "unit_price", e.target.value)}
                className={`${inp} text-center sm:w-full`} title="Unit price"
              />
              <input type="number" min={0} max={100} step="0.5"
                value={item.vat_rate} onChange={(e) => setItemField(idx, "vat_rate", e.target.value)}
                className={`${inp} text-center sm:w-full`} title="VAT %"
              />
              <div className="flex items-center justify-end font-medium text-neutral-900 sm:pr-1">
                {form.currency === "EUR" ? "€" : form.currency}{(item.quantity * item.unit_price).toFixed(2)}
              </div>
              <button type="button" onClick={() => removeItem(idx)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem}
          className="mt-3 text-sm font-medium text-brand-700 hover:underline">
          + Add line item
        </button>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>VAT</span>
              <span>€{vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-neutral-900">
              <span>Total</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">Notes / Footer</h2>
        <textarea name="notes" value={form.notes} onChange={setField} rows={3}
          placeholder="Thank you for your business. Payment details above."
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving || sending}
          className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save draft"}
        </button>
        {form.buyer_email && (
          <button type="button" onClick={handleSendEmail} disabled={saving || sending}
            className="rounded-lg border border-brand-700 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50">
            {sending ? "Sending…" : "Save & send by email"}
          </button>
        )}
        {isEdit && invoice?.id && (
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
            Download PDF
          </a>
        )}
        <a href={`/app/invoices/${companyId}`}
          className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
          Cancel
        </a>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-border px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
