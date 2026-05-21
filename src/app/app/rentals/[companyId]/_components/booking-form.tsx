"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { LocationInput } from "@/components/operator/location-input";
import { DateInput } from "@/components/ui/date-input";

type BookingStatus   = "confirmed" | "active" | "returned" | "cancelled";
type Insurance       = "none" | "partial" | "full";
type PaymentMethod   = "cash" | "card" | "bank_transfer" | "other";

interface Vehicle { id: string; make: string; model: string; year: number; plate: string; }
interface Customer { id: string; full_name: string; phone: string; blacklisted: boolean; blacklist_reason: string | null; }

interface Booking {
  id: string;
  vehicle_id: string;
  customer_id: string | null;
  status: BookingStatus;
  start_at: string;
  end_at: string;
  insurance: Insurance;
  child_seat_infant: boolean;
  child_seat_toddler: boolean;
  child_seat_child: boolean;
  booking_price: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  deposit_returned_at: string | null;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  pickup_location: string | null;
  return_location: string | null;
  notes: string | null;
  is_longterm: boolean;
  renewal_period_days: number | null;
}

interface Props {
  companyId: string;
  vehicles: Vehicle[];
  booking?: Booking;
  initialCustomer?: Customer;
  locationPresets?: string[];
}

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalDatetimeValue(d.toISOString());
}
function defaultEnd() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 25);
  return toLocalDatetimeValue(d.toISOString());
}

export function BookingForm({ companyId, vehicles, booking, initialCustomer, locationPresets = [] }: Props) {
  const router = useRouter();
  const isEdit = Boolean(booking);

  const [form, setForm] = useState({
    vehicle_id:         booking?.vehicle_id ?? (vehicles[0]?.id ?? ""),
    status:             (booking?.status ?? "confirmed") as BookingStatus,
    start_at:           booking ? toLocalDatetimeValue(booking.start_at) : defaultStart(),
    end_at:             booking ? toLocalDatetimeValue(booking.end_at)   : defaultEnd(),
    insurance:          (booking?.insurance ?? "none") as Insurance,
    child_seat_infant:  booking?.child_seat_infant  ?? false,
    child_seat_toddler: booking?.child_seat_toddler ?? false,
    child_seat_child:   booking?.child_seat_child   ?? false,
    booking_price:      booking?.booking_price  != null ? String(booking.booking_price)  : "",
    deposit_amount:     booking?.deposit_amount != null ? String(booking.deposit_amount) : "",
    deposit_paid:           booking?.deposit_paid ?? false,
    deposit_returned_at:    booking?.deposit_returned_at ?? "",
    paid_at:                booking?.paid_at ?? "",
    payment_method:         (booking?.payment_method ?? "") as PaymentMethod | "",
    pickup_location:    booking?.pickup_location ?? "",
    return_location:    booking?.return_location ?? "",
    notes:              booking?.notes ?? "",
    is_longterm:        booking?.is_longterm ?? false,
    renewal_period_days: booking?.renewal_period_days != null ? String(booking.renewal_period_days) : "30",
  });

  // ── Customer search ──
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer ?? null);
  const [customerQuery, setCustomerQuery] = useState(initialCustomer?.full_name ?? "");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("+");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function searchCustomers(q: string) {
    if (!q.trim()) { setCustomerResults([]); setShowDropdown(false); return; }
    const supabase = getAuthBrowserClient();
    const term = `%${q.trim()}%`;
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone, blacklisted, blacklist_reason")
      .eq("company_id", companyId)
      .or(`full_name.ilike.${term},phone.ilike.${term}`)
      .limit(8);
    setCustomerResults(data ?? []);
    setShowDropdown(true);
  }

  function handleCustomerInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setCustomerQuery(q);
    setSelectedCustomer(null);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => searchCustomers(q), 250);
  }

  function selectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustomerQuery(c.full_name);
    setShowDropdown(false);
    setShowInlineAdd(false);
  }

  async function handleAddNewCustomer() {
    const name  = newCustomerName.trim();
    const phone = newCustomerPhone.trim();
    if (!name)  { alert("Name is required."); return; }
    if (!phone.startsWith("+") || phone.replace(/\D/g, "").length < 7) {
      alert("Phone must start with + and include a country code."); return;
    }
    setAddingCustomer(true);
    const supabase = getAuthBrowserClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({ company_id: companyId, full_name: name, phone })
      .select("id, full_name, phone, blacklisted, blacklist_reason")
      .single();
    setAddingCustomer(false);
    if (error || !data) { alert("Failed to save customer: " + (error?.message ?? "unknown error")); return; }
    selectCustomer(data as Customer);
    setShowInlineAdd(false);
    setNewCustomerName("");
    setNewCustomerPhone("+");
  }

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  // Days calculation
  const days = (() => {
    const s = new Date(form.start_at).getTime();
    const e = new Date(form.end_at).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return null;
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  })();

  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) { setErrorMsg("Please select a customer."); return; }
    if (!form.vehicle_id)  { setErrorMsg("Please select a vehicle."); return; }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setErrorMsg("Return date must be after pickup date."); return;
    }
    setSubmitStatus("saving");
    setErrorMsg("");

    const supabase = getAuthBrowserClient();
    const payload = {
      company_id:         companyId,
      vehicle_id:         form.vehicle_id,
      customer_id:        selectedCustomer.id,
      status:             form.status,
      start_at:           new Date(form.start_at).toISOString(),
      end_at:             new Date(form.end_at).toISOString(),
      insurance:          form.insurance,
      child_seat_infant:  form.child_seat_infant,
      child_seat_toddler: form.child_seat_toddler,
      child_seat_child:   form.child_seat_child,
      booking_price:      form.booking_price  ? parseFloat(form.booking_price)  : null,
      deposit_amount:     form.deposit_amount ? parseFloat(form.deposit_amount) : null,
      deposit_paid:           form.deposit_paid,
      deposit_returned_at:    form.deposit_returned_at  || null,
      paid_at:                form.paid_at              || null,
      payment_method:         (form.payment_method || null) as PaymentMethod | null,
      pickup_location:    form.pickup_location.trim() || null,
      return_location:    form.return_location.trim() || null,
      notes:              form.notes.trim() || null,
      is_longterm:        form.is_longterm,
      renewal_period_days: form.is_longterm && form.renewal_period_days ? parseInt(form.renewal_period_days) : null,
      updated_at:         new Date().toISOString(),
    };

    const { error } = isEdit
      ? await supabase.from("bookings").update(payload).eq("id", booking!.id)
      : await supabase.from("bookings").insert(payload);

    if (error) { setSubmitStatus("error"); setErrorMsg(error.message); return; }
    router.push(`/app/rentals/${companyId}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!booking || !confirm("Delete this booking? This cannot be undone.")) return;
    setSubmitStatus("deleting");
    await getAuthBrowserClient().from("bookings").delete().eq("id", booking.id);
    router.push(`/app/rentals/${companyId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Customer ── */}
      <Section title="Customer">
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-neutral-700">Customer *</label>
          <input
            type="text"
            value={customerQuery}
            onChange={handleCustomerInput}
            onFocus={() => customerQuery && !selectedCustomer && setShowDropdown(true)}
            placeholder="Search by name or phone…"
            className={inp}
            autoComplete="off"
          />
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-white shadow-lg">
              {customerResults.length > 0 ? (
                <>
                  {customerResults.map((c) => (
                    <button key={c.id} type="button"
                      onClick={() => selectCustomer(c)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50">
                      <span>
                        <span className="font-medium text-neutral-900">{c.full_name}</span>
                        <span className="ml-2 text-neutral-400">{c.phone}</span>
                      </span>
                      {c.blacklisted && <span className="text-xs font-medium text-red-600">⚠ Blacklisted</span>}
                    </button>
                  ))}
                  <div className="border-t border-border px-4 py-2">
                    <button type="button" onClick={() => { setShowDropdown(false); setShowInlineAdd(true); }}
                      className="text-sm text-brand-700 hover:underline">
                      + Add new customer
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-neutral-500">
                  No customers found.{" "}
                  <button type="button" onClick={() => { setShowDropdown(false); setShowInlineAdd(true); setNewCustomerName(customerQuery); }}
                    className="text-brand-700 hover:underline">
                    Add &ldquo;{customerQuery}&rdquo; as new customer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Blacklist warning */}
        {selectedCustomer?.blacklisted && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 text-base">⚠</span>
            <div>
              <span className="font-semibold">Blacklisted customer.</span>
              {selectedCustomer.blacklist_reason && <span className="ml-1">{selectedCustomer.blacklist_reason}</span>}
              <span className="ml-1">Proceed with caution.</span>
            </div>
          </div>
        )}

        {/* Inline add new customer */}
        {showInlineAdd && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
            <p className="mb-3 text-sm font-semibold text-brand-900">New customer</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700">Full name *</label>
                <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="John Smith" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700">Phone * (with country code)</label>
                <input value={newCustomerPhone}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (!v.startsWith("+")) v = "+" + v.replace(/^\+*/, "");
                    setNewCustomerPhone(v);
                  }}
                  placeholder="+371 12345678" className={inp} />
              </div>
            </div>
            <p className="mt-2 text-xs text-neutral-400">You can add more details in the Customers section later.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleAddNewCustomer} disabled={addingCustomer}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
                {addingCustomer ? "Saving…" : "Save & select"}
              </button>
              <button type="button" onClick={() => setShowInlineAdd(false)}
                className="text-sm text-neutral-500 hover:text-neutral-700">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* ── Vehicle & dates ── */}
      <Section title="Vehicle & dates">
        <Field label="Vehicle *">
          <select name="vehicle_id" value={form.vehicle_id} onChange={set} className={inp}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model} — {v.plate}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <DateTimeField label="Pickup date & time *" required value={form.start_at}
            onChange={(v) => setForm((p) => ({ ...p, start_at: v }))} />
          <DateTimeField label="Return date & time *" required value={form.end_at}
            onChange={(v) => setForm((p) => ({ ...p, end_at: v }))} />
        </div>
        {days != null && !form.is_longterm && (
          <p className="text-sm text-neutral-500">
            Duration: <span className="font-semibold text-neutral-800">{days} {days === 1 ? "day" : "days"}</span>
          </p>
        )}

        {/* Long-term rental toggle */}
        <div className="rounded-xl border border-border bg-slate-50 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-800">Long-term rental</p>
              <p className="text-xs text-neutral-500">Rolling rental with no fixed end date — renews each period</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.is_longterm}
              onClick={() => setForm((p) => ({ ...p, is_longterm: !p.is_longterm }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none
                ${form.is_longterm ? "bg-brand-700" : "bg-neutral-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                ${form.is_longterm ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>
          {form.is_longterm && (
            <div className="mt-4 space-y-3">
              <Field label="First paid period ends (renewal date) *">
                <DateInput
                  value={form.end_at.slice(0, 10)}
                  onChange={(v) => setForm((p) => ({ ...p, end_at: v ? `${v}T12:00` : p.end_at }))}
                />
                <p className="mt-1 text-xs text-neutral-400">The car shows on calendar as occupied past this date until you mark a renewal.</p>
              </Field>
              <Field label="Renewal period">
                <select
                  value={form.renewal_period_days}
                  onChange={(e) => setForm((p) => ({ ...p, renewal_period_days: e.target.value }))}
                  className={inp}
                >
                  <option value="30">Monthly (30 days)</option>
                  <option value="90">Quarterly (90 days)</option>
                  <option value="14">2 weeks</option>
                  <option value="60">2 months (60 days)</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                </select>
              </Field>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Pickup location">
            <LocationInput
              name="pickup_location"
              value={form.pickup_location}
              onChange={(v) => setForm((p) => ({ ...p, pickup_location: v }))}
              presets={locationPresets}
              placeholder="e.g. Airport Terminal 1"
              className={inp}
            />
          </Field>
          <Field label="Return location">
            <LocationInput
              name="return_location"
              value={form.return_location}
              onChange={(v) => setForm((p) => ({ ...p, return_location: v }))}
              presets={locationPresets}
              placeholder="e.g. Main office"
              className={inp}
            />
          </Field>
        </div>
      </Section>

      {/* ── Extras ── */}
      <Section title="Extras">
        <Field label="Insurance">
          <select name="insurance" value={form.insurance} onChange={set} className={inp}>
            <option value="none">No insurance</option>
            <option value="partial">Partial</option>
            <option value="full">Full</option>
          </select>
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">Child seats</p>
          <div className="space-y-2">
            {([
              { name: "child_seat_infant",  label: "Infant seat (0–1 y)" },
              { name: "child_seat_toddler", label: "Toddler seat (1–6 y)" },
              { name: "child_seat_child",   label: "Child seat (6–12 y)" },
            ] as const).map((seat) => (
              <label key={seat.name} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" name={seat.name}
                  checked={form[seat.name]} onChange={set}
                  className="h-4 w-4 rounded border-border text-brand-700 focus:ring-brand-500" />
                <span className="text-sm text-neutral-700">{seat.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Payment ── */}
      <Section title="Payment">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Booking price (€)">
            <input name="booking_price" type="number" min={0} step={0.01} value={form.booking_price} onChange={set}
              placeholder="0.00" className={inp} />
          </Field>
          <Field label="Deposit amount (€)">
            <input name="deposit_amount" type="number" min={0} step={0.01} value={form.deposit_amount} onChange={set}
              placeholder="0.00" className={inp} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Payment received date">
            <DateInput
              value={form.paid_at}
              onChange={(v) => setForm((p) => ({ ...p, paid_at: v }))}
              className={`mt-1 ${inp}`}
            />
          </Field>
          <Field label="Payment method">
            <select name="payment_method" value={form.payment_method} onChange={set} className={inp}>
              <option value="">Not specified</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 items-center">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" name="deposit_paid" checked={form.deposit_paid} onChange={set}
              className="h-4 w-4 rounded border-border text-brand-700 focus:ring-brand-500" />
            <span className="text-sm text-neutral-700">Deposit received</span>
          </label>
          <Field label="Deposit returned date">
            <p className="mb-1 text-xs text-neutral-400">Leave blank if still held</p>
            <DateInput
              value={form.deposit_returned_at}
              onChange={(v) => setForm((p) => ({ ...p, deposit_returned_at: v }))}
              className={`mt-1 ${inp}`}
            />
          </Field>
        </div>
      </Section>

      {/* ── Status & notes ── */}
      <Section title="Status & notes">
        <Field label="Booking status">
          <select name="status" value={form.status} onChange={set} className={inp}>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active (car is out)</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Internal notes">
          <textarea name="notes" rows={3} value={form.notes} onChange={set}
            placeholder="Anything the team should know about this rental…"
            className={inp} />
        </Field>
      </Section>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      )}

      <div className="flex items-center justify-between pb-10">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitStatus === "saving" || submitStatus === "deleting"}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {submitStatus === "saving" ? "Saving…" : isEdit ? "Save changes" : "Create booking"}
          </button>
          <a href={`/app/rentals/${companyId}`}
            className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
            Cancel
          </a>
        </div>
        {isEdit && (
          <button type="button" onClick={handleDelete}
            disabled={submitStatus === "deleting" || submitStatus === "saving"}
            className="text-sm text-red-500 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-50">
            {submitStatus === "deleting" ? "Deleting…" : "Delete booking"}
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

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINS  = ["00", "15", "30", "45"];

function TimeSelect({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [h = "08", m = "00"] = value ? value.split(":") : [];
  const nearestMin = MINS.reduce((a, b) => Math.abs(parseInt(b) - parseInt(m)) < Math.abs(parseInt(a) - parseInt(m)) ? b : a);
  return (
    <div className={`flex items-center gap-0.5 ${className ?? ""}`}>
      <select value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className="rounded-l-lg border border-border bg-white px-2 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
        {HOURS.map((hh) => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span className="border-y border-border bg-white px-1 py-2 text-sm text-neutral-400">:</span>
      <select value={nearestMin} onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className="rounded-r-lg border border-border bg-white px-2 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
        {MINS.map((mm) => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
}

function DateTimeField({ label, value, onChange, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [datePart = "", timePart = "08:00"] = value ? value.split("T") : [];
  const inp = "rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500";
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      <div className="mt-1 flex flex-wrap gap-2">
        <DateInput
          required={required}
          value={datePart}
          onChange={(d) => onChange(`${d}T${timePart}`)}
          className={`flex-1 min-w-[130px] ${inp}`}
        />
        <TimeSelect value={timePart} onChange={(t) => onChange(`${datePart}T${t}`)} />
      </div>
    </div>
  );
}
