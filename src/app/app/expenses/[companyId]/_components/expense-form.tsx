"use client";

import { useState } from "react";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { DateInput } from "@/components/ui/date-input";

type ExpenseCategory = "salary" | "tax" | "rent" | "phone_internet" | "accounting_legal" | "supplies_stock" | "company_insurance" | "other";

export interface Payee { id: string; name: string; }

interface Expense {
  id: string; date: string; category: ExpenseCategory; description: string;
  amount: number; supplier: string | null; invoice_number: string | null;
  quantity: number | null; unit: string | null; is_recurring: boolean; notes: string | null;
  covers_from: string | null; covers_until: string | null;
}

interface Props { companyId: string; expense?: Expense; payees?: Payee[]; }

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  salary:            "Salary",
  tax:               "Tax",
  rent:              "Rent / Office",
  phone_internet:    "Phone / Internet",
  accounting_legal:  "Accounting / Legal",
  supplies_stock:    "Supplies / Stock",
  company_insurance: "Company insurance",
  other:             "Other",
};

export const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  salary:            "bg-violet-50 text-violet-700",
  tax:               "bg-red-50 text-red-700",
  rent:              "bg-orange-50 text-orange-700",
  phone_internet:    "bg-sky-50 text-sky-700",
  accounting_legal:  "bg-indigo-50 text-indigo-700",
  supplies_stock:    "bg-teal-50 text-teal-700",
  company_insurance: "bg-emerald-50 text-emerald-700",
  other:             "bg-neutral-100 text-neutral-600",
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

export function ExpenseForm({ companyId, expense, payees = [] }: Props) {
  const isEdit = Boolean(expense);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    date:           expense?.date           ?? today,
    category:       (expense?.category      ?? "other") as ExpenseCategory,
    description:    expense?.description    ?? "",
    amount:         expense?.amount != null ? String(expense.amount) : "",
    supplier:       expense?.supplier       ?? "",
    invoice_number: expense?.invoice_number ?? "",
    quantity:       expense?.quantity != null ? String(expense.quantity) : "",
    unit:           expense?.unit           ?? "",
    is_recurring:   expense?.is_recurring   ?? false,
    notes:          expense?.notes          ?? "",
  });

  const [amortizeOn,  setAmortizeOn]  = useState(!!(expense?.covers_from || expense?.covers_until));
  const [coversFrom,  setCoversFrom]  = useState(expense?.covers_from  ?? "");
  const [coversUntil, setCoversUntil] = useState(expense?.covers_until ?? "");

  const [status,   setStatus]   = useState<"idle" | "saving" | "deleting">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isSupplies = form.category === "supplies_stock";

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const val = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((p) => ({ ...p, [e.target.name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!form.description.trim()) { setErrorMsg("Description is required."); return; }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0) { setErrorMsg("Enter a valid amount (0 or more)."); return; }

    setStatus("saving");
    const supabase = getAuthBrowserClient();
    const payload = {
      company_id:     companyId,
      date:           form.date,
      category:       form.category,
      description:    form.description.trim(),
      amount,
      supplier:       form.supplier.trim()       || null,
      invoice_number: form.invoice_number.trim() || null,
      quantity:       isSupplies && form.quantity ? parseFloat(form.quantity) : null,
      unit:           isSupplies && form.unit.trim() ? form.unit.trim() : null,
      is_recurring:   form.is_recurring,
      notes:          form.notes.trim() || null,
      covers_from:    amortizeOn && coversFrom  ? coversFrom  : null,
      covers_until:   amortizeOn && coversUntil ? coversUntil : null,
    };

    const { error } = isEdit
      ? await supabase.from("company_expenses").update(payload).eq("id", expense!.id)
      : await supabase.from("company_expenses").insert(payload);

    if (error) { setErrorMsg(error.message); setStatus("idle"); return; }
    window.location.href = `/app/expenses/${companyId}`;
  }

  async function handleDelete() {
    if (!expense || !confirm("Delete this expense entry?")) return;
    setStatus("deleting");
    const { error } = await getAuthBrowserClient().from("company_expenses").delete().eq("id", expense.id);
    if (error) { alert(error.message); setStatus("idle"); return; }
    window.location.href = `/app/expenses/${companyId}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date *" hint="DD.MM.YYYY">
          <DateInput required value={form.date} onChange={(v) => setForm((p) => ({ ...p, date: v }))} className={inp} />
        </Field>
        <Field label="Category *">
          <select name="category" value={form.category} onChange={set} className={inp}>
            {(Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description *">
        <input name="description" required value={form.description} onChange={set}
          placeholder={
            form.category === "salary" ? "e.g. Jānis Bērziņš — March salary" :
            form.category === "rent" ? "e.g. Office rent — March" :
            form.category === "supplies_stock" ? "e.g. Engine oil 5W-30 — 208L drum" :
            form.category === "tax" ? "e.g. VAT payment Q1 2026" :
            "Description…"
          }
          className={inp} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount (€) *">
          <input name="amount" type="number" min={0} step={0.01} required value={form.amount}
            onChange={set} placeholder="0.00" className={inp} />
        </Field>
        {isSupplies ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quantity">
              <input name="quantity" type="number" min={0} step={0.001} value={form.quantity}
                onChange={set} placeholder="208" className={inp} />
            </Field>
            <Field label="Unit">
              <input name="unit" value={form.unit} onChange={set} placeholder="L, pcs, kg…" className={inp} />
            </Field>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              {form.category === "salary" ? "Employee" : "Supplier / Payee"}
            </label>
            {payees.length > 0 && (
              <div className="mt-1.5 mb-1.5 flex flex-wrap gap-1.5">
                {payees.map((p) => (
                  <button key={p.id} type="button" onClick={() => setForm((f) => ({ ...f, supplier: p.name }))}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors
                      ${form.supplier === p.name
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-border bg-slate-50 text-neutral-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                      }`}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <input name="supplier" value={form.supplier} onChange={set}
              placeholder={payees.length > 0 ? "Or type a custom name…" : form.category === "salary" ? "Employee name" : "Company / payee name"}
              className={inp} />
          </div>
        )}
      </div>

      {isSupplies && (
        <Field label="Supplier">
          <input name="supplier" value={form.supplier} onChange={set} placeholder="e.g. Auto Depot SIA" className={inp} />
        </Field>
      )}

      <Field label="Invoice / Reference number">
        <input name="invoice_number" value={form.invoice_number} onChange={set} placeholder="INV-2026-001" className={inp} />
      </Field>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-slate-50 px-4 py-3">
          <input type="checkbox" name="is_recurring" checked={form.is_recurring} onChange={set}
            className="h-4 w-4 rounded border-border text-brand-700" />
          <div>
            <p className="text-sm font-medium text-neutral-800">Recurring expense</p>
            <p className="text-xs text-neutral-400">Mark if this repeats monthly (rent, salary, phone, etc.)</p>
          </div>
        </label>

        <div className="rounded-xl border border-border bg-slate-50 px-4 py-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={amortizeOn} onChange={(e) => setAmortizeOn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-brand-700" />
            <div>
              <p className="text-sm font-medium text-neutral-800">Spread cost across a period (amortize)</p>
              <p className="text-xs text-neutral-400 mt-0.5">Use for annual insurance, memberships — allocates daily portion to each month in P&amp;L</p>
            </div>
          </label>
          {amortizeOn && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Covers from</label>
                <DateInput value={coversFrom} onChange={setCoversFrom} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Covers until</label>
                <DateInput value={coversUntil} onChange={setCoversUntil} className={inp} />
              </div>
            </div>
          )}
        </div>
      </div>

      <Field label="Notes">
        <textarea name="notes" rows={2} value={form.notes} onChange={set}
          placeholder="Any additional notes…" className={inp} />
      </Field>

      <div className="flex items-center justify-between border-t border-border pt-4">
        {isEdit ? (
          <button type="button" onClick={handleDelete} disabled={status !== "idle"}
            className="text-sm text-red-600 hover:underline disabled:opacity-50">
            {status === "deleting" ? "Deleting…" : "Delete entry"}
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <a href={`/app/expenses/${companyId}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-slate-50">
            Cancel
          </a>
          <button type="submit" disabled={status !== "idle"}
            className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {status === "saving" ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
          </button>
        </div>
      </div>
    </form>
  );
}
