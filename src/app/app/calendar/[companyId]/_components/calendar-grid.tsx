"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";

type Insurance     = "none" | "partial" | "full";
type PaymentMethod = "cash" | "card" | "bank_transfer" | "other";

interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  is_maintenance: boolean;
  customer_name: string | null;
  customer_phone: string | null;
  customer_id: string | null;
  vehicle_id: string;
  insurance: Insurance | null;
  child_seat_infant: boolean;
  child_seat_toddler: boolean;
  child_seat_child: boolean;
  booking_price: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  payment_method: PaymentMethod | null;
  pickup_location: string | null;
  return_location: string | null;
  notes: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string;
  status: string;
  gov_inspection_next: string | null;
  service_next: string | null;
  insurance_valid_until: string | null;
}

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  blacklisted: boolean;
}

interface Props {
  companyId: string;
  vehicles: Vehicle[];
  bookings: Booking[];
}

const STATUS_COLOR: Record<string, string> = {
  confirmed:   "bg-amber-400 hover:bg-amber-500",
  active:      "bg-emerald-500 hover:bg-emerald-600",
  returned:    "bg-neutral-300 hover:bg-neutral-400",
  maintenance: "bg-slate-400 hover:bg-slate-500",
};
const STATUS_TEXT: Record<string, string> = {
  confirmed:   "text-amber-900",
  active:      "text-white",
  returned:    "text-neutral-600",
  maintenance: "text-white",
};

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_SHORT   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const DAY_W_DESKTOP = 36;
const DAY_W_MOBILE  = 28;
const DAYS_PAST   = 60;
const DAYS_FUTURE = 365;
const TOTAL_DAYS  = DAYS_PAST + 1 + DAYS_FUTURE;
const SCROLL_OFFSET = 7;

// Returns the correct day width depending on viewport (called client-side only)
function getDayW() {
  if (typeof window === "undefined") return DAY_W_DESKTOP;
  return window.innerWidth < 1024 ? DAY_W_MOBILE : DAY_W_DESKTOP;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function toStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function strToLocalDatetime(dateStr: string, time = "10:00") {
  return `${dateStr}T${time}`;
}
function strAddDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return toStr(d);
}

const INP = "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

// ── Shared vehicle selector ─────────────────────────────────────────────────

function VehicleSelect({
  value, onChange, vehicles, allBookings, excludeBookingId, startAt, endAt, className,
}: {
  value: string;
  onChange: (id: string) => void;
  vehicles: Vehicle[];
  allBookings: Booking[];
  excludeBookingId?: string;
  startAt: string;
  endAt: string;
  className?: string;
}) {
  const startIso = startAt ? new Date(startAt).toISOString() : "";
  const endIso   = endAt   ? new Date(endAt).toISOString()   : "";

  const sDate = startIso ? new Date(startIso) : null;
  const eDate = endIso   ? new Date(endIso)   : null;

  const available   = vehicles.filter((v) => {
    if (v.id === value) return true;
    if (!sDate || !eDate) return true;
    return !allBookings.some(
      (b) => b.id !== excludeBookingId &&
             b.vehicle_id === v.id &&
             b.status !== "cancelled" &&
             new Date(b.start_at) < eDate &&
             new Date(b.end_at)   > sDate
    );
  });
  const unavailable = vehicles.filter((v) => !available.find((a) => a.id === v.id));

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className ?? INP}>
      <option value="">Select car…</option>
      <optgroup label="Available on these dates">
        {available.map((v) => (
          <option key={v.id} value={v.id}>
            {v.make} {v.model} — {v.plate}{v.id === value ? "" : ""}
          </option>
        ))}
      </optgroup>
      {unavailable.length > 0 && (
        <optgroup label="Booked (unavailable)">
          {unavailable.map((v) => (
            <option key={v.id} value={v.id} disabled>
              {v.make} {v.model} — {v.plate}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

// ── Customer search ─────────────────────────────────────────────────────────

function CustomerSearch({
  companyId,
  value,
  onChange,
}: {
  companyId: string;
  value: Customer | null;
  onChange: (c: Customer | null) => void;
}) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [open, setOpen]       = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const supabase = getAuthBrowserClient();
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, phone, blacklisted")
        .eq("company_id", companyId)
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(8);
      setResults(data ?? []);
      setOpen(true);
    }, 250);
  }, [query, companyId]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-neutral-900">{value.full_name}</p>
          <p className="text-xs text-neutral-400">{value.phone}</p>
        </div>
        <button onClick={() => { onChange(null); setQuery(""); }}
          className="ml-2 text-neutral-400 hover:text-neutral-600">✕</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search by name or phone…"
        className={INP}
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-white shadow-lg">
          {results.map((c) => (
            <button key={c.id}
              onMouseDown={() => { onChange(c); setQuery(""); setOpen(false); }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50">
              <span className="font-medium text-neutral-900">{c.full_name}</span>
              <span className="text-xs text-neutral-400">{c.phone}</span>
            </button>
          ))}
          <Link href={`/app/customers/${companyId}/add`}
            className="flex w-full items-center px-3 py-2 text-sm text-brand-700 hover:bg-slate-50 border-t border-border">
            + Add new customer
          </Link>
        </div>
      )}
      {open && results.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-white shadow-lg">
          <p className="px-3 py-2 text-sm text-neutral-400">No results</p>
          <Link href={`/app/customers/${companyId}/add`}
            className="flex w-full items-center px-3 py-2 text-sm text-brand-700 hover:bg-slate-50 border-t border-border">
            + Add new customer
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Create booking popup ─────────────────────────────────────────────────────

interface CreatePopupProps {
  companyId: string;
  vehicles: Vehicle[];
  allBookings: Booking[];
  preVehicleId?: string;
  preStart?: string;
  preEnd?: string;
  onClose: () => void;
  onCreated: (b: Booking) => void;
}

function CreateBookingPopup({
  companyId, vehicles, allBookings, preVehicleId, preStart, preEnd, onClose, onCreated,
}: CreatePopupProps) {
  const [customer, setCustomer]         = useState<Customer | null>(null);
  const [isMaintenance, setMaintenance] = useState(false);
  const [form, setForm] = useState({
    vehicle_id:         preVehicleId ?? (vehicles[0]?.id ?? ""),
    start_at:           preStart ?? strToLocalDatetime(toStr(new Date()), "10:00"),
    end_at:             preEnd   ?? strToLocalDatetime(strAddDay(toStr(new Date())), "10:00"),
    pickup_location:    "",
    return_location:    "",
    child_seat_infant:  false,
    child_seat_toddler: false,
    child_seat_child:   false,
    insurance:          "none" as Insurance,
    booking_price:      "",
    deposit_amount:     "",
    deposit_paid:       false,
    payment_method:     "" as PaymentMethod | "",
    notes:              "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const days = (() => {
    const s = new Date(form.start_at).getTime();
    const e = new Date(form.end_at).getTime();
    return (isNaN(s) || isNaN(e) || e <= s) ? null : Math.ceil((e - s) / (1000*60*60*24));
  })();

  function setField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSave() {
    if (!isMaintenance && !customer) { setError("Please select a customer."); return; }
    if (!form.vehicle_id) { setError("Please select a car."); return; }
    if (new Date(form.end_at) <= new Date(form.start_at)) { setError("End must be after start."); return; }
    setSaving(true); setError("");
    const supabase = getAuthBrowserClient();
    const payload = {
      company_id:         companyId,
      customer_id:        isMaintenance ? null : customer!.id,
      vehicle_id:         form.vehicle_id,
      is_maintenance:     isMaintenance,
      status:             "confirmed" as const,
      start_at:           new Date(form.start_at).toISOString(),
      end_at:             new Date(form.end_at).toISOString(),
      pickup_location:    form.pickup_location.trim() || null,
      return_location:    form.return_location.trim() || null,
      child_seat_infant:  form.child_seat_infant,
      child_seat_toddler: form.child_seat_toddler,
      child_seat_child:   form.child_seat_child,
      insurance:          form.insurance,
      booking_price:      form.booking_price  ? parseFloat(form.booking_price)  : null,
      deposit_amount:     form.deposit_amount ? parseFloat(form.deposit_amount) : null,
      deposit_paid:       form.deposit_paid,
      payment_method:     (form.payment_method || null) as PaymentMethod | null,
      notes:              form.notes.trim() || null,
    };
    const { data, error: err } = await supabase.from("bookings").insert(payload).select().single();
    setSaving(false);
    if (err || !data) { setError(err?.message ?? "Failed to save."); return; }
    onCreated({
      ...data,
      is_maintenance: isMaintenance,
      customer_name:  isMaintenance ? null : customer?.full_name ?? null,
      customer_phone: isMaintenance ? null : customer?.phone ?? null,
      customer_id:    isMaintenance ? null : customer?.id ?? null,
    } as Booking);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-base font-semibold text-neutral-900">New booking</p>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Type toggle */}
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setMaintenance(false)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${!isMaintenance ? "border-brand-700 bg-brand-50 text-brand-700" : "border-border text-neutral-500 hover:bg-slate-50"}`}>
              Rental
            </button>
            <button type="button"
              onClick={() => setMaintenance(true)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${isMaintenance ? "border-slate-500 bg-slate-100 text-slate-700" : "border-border text-neutral-500 hover:bg-slate-50"}`}>
              🔧 Maintenance block
            </button>
          </div>

          {/* Customer (only for rentals) */}
          {!isMaintenance && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Customer</p>
            <CustomerSearch companyId={companyId} value={customer} onChange={setCustomer} />
            {customer?.blacklisted && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                ⚠ This customer is blacklisted.
              </p>
            )}
          </div>
          )}

          {/* Pickup */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Pickup</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">Date & time</label>
                <CalDateTimeInput value={form.start_at}
                  onChange={(v) => setForm((p) => ({ ...p, start_at: v }))} className={INP} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Location</label>
                <input name="pickup_location" value={form.pickup_location} onChange={setField}
                  placeholder="e.g. Airport" className={INP} />
              </div>
            </div>
          </div>

          {/* Return */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Return</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">Date & time</label>
                <CalDateTimeInput value={form.end_at}
                  onChange={(v) => setForm((p) => ({ ...p, end_at: v }))} className={INP} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Location</label>
                <input name="return_location" value={form.return_location} onChange={setField}
                  placeholder="e.g. Main office" className={INP} />
              </div>
            </div>
            {days && <p className="mt-1.5 text-xs text-neutral-400">Duration: <span className="font-semibold text-neutral-700">{days} {days === 1 ? "day" : "days"}</span></p>}
          </div>

          {/* Car */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Car</p>
            <VehicleSelect
              value={form.vehicle_id}
              onChange={(id) => setForm((p) => ({ ...p, vehicle_id: id }))}
              vehicles={vehicles}
              allBookings={allBookings}
              startAt={form.start_at}
              endAt={form.end_at}
            />
          </div>

          {/* Extras */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Extras</p>
            <div className="space-y-2">
              {([
                { name: "child_seat_infant",  label: "Infant seat (0–1 y)" },
                { name: "child_seat_toddler", label: "Toddler seat (1–6 y)" },
                { name: "child_seat_child",   label: "Child seat (6–12 y)" },
              ] as const).map((s) => (
                <label key={s.name} className="flex cursor-pointer items-center gap-2.5">
                  <input type="checkbox" name={s.name} checked={form[s.name]} onChange={setField}
                    className="h-4 w-4 rounded border-border text-brand-700" />
                  <span className="text-sm text-neutral-700">{s.label}</span>
                </label>
              ))}
              <div className="pt-1">
                <label className="block text-xs font-medium text-neutral-600">Insurance</label>
                <select name="insurance" value={form.insurance} onChange={setField} className={INP}>
                  <option value="none">No insurance</option>
                  <option value="partial">Partial</option>
                  <option value="full">Full</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Payment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">Booking price (€)</label>
                <input name="booking_price" type="number" min={0} step={0.01} value={form.booking_price}
                  onChange={setField} placeholder="0.00" className={INP} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Deposit (€)</label>
                <input name="deposit_amount" type="number" min={0} step={0.01} value={form.deposit_amount}
                  onChange={setField} placeholder="0.00" className={INP} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" name="deposit_paid" checked={form.deposit_paid} onChange={setField}
                  className="h-4 w-4 rounded border-border text-brand-700" />
                Deposit received
              </label>
              <div className="flex-1">
                <select name="payment_method" value={form.payment_method} onChange={setField} className={INP}>
                  <option value="">Payment method…</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Notes</p>
            <textarea name="notes" rows={2} value={form.notes} onChange={setField}
              placeholder="Anything the team should know…" className={INP} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {saving ? "Saving…" : "Create booking"}
          </button>
          <button onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit booking popup ───────────────────────────────────────────────────────

interface BookingPopupProps {
  booking: Booking;
  vehicles: Vehicle[];
  allBookings: Booking[];
  companyId: string;
  onClose: () => void;
  onUpdated: (bookingId: string, changes: Partial<Booking>) => void;
}

function BookingPopup({ booking, vehicles, allBookings, companyId, onClose, onUpdated }: BookingPopupProps) {
  const [isMaintenance] = useState(booking.is_maintenance);
  const [form, setForm] = useState({
    vehicle_id:         booking.vehicle_id,
    start_at:           toLocalDatetime(booking.start_at),
    end_at:             toLocalDatetime(booking.end_at),
    pickup_location:    booking.pickup_location ?? "",
    return_location:    booking.return_location ?? "",
    child_seat_infant:  booking.child_seat_infant,
    child_seat_toddler: booking.child_seat_toddler,
    child_seat_child:   booking.child_seat_child,
    insurance:          (booking.insurance ?? "none") as Insurance,
    booking_price:      booking.booking_price  != null ? String(booking.booking_price)  : "",
    deposit_amount:     booking.deposit_amount != null ? String(booking.deposit_amount) : "",
    deposit_paid:       booking.deposit_paid,
    payment_method:     (booking.payment_method ?? "") as PaymentMethod | "",
    notes:              booking.notes ?? "",
  });
  const [saving, setSaving]       = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError]         = useState("");

  const days = (() => {
    const s = new Date(form.start_at).getTime();
    const e = new Date(form.end_at).getTime();
    return (isNaN(s) || isNaN(e) || e <= s) ? null : Math.ceil((e - s) / (1000*60*60*24));
  })();

  function setField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSave() {
    if (new Date(form.end_at) <= new Date(form.start_at)) { setError("Return must be after pickup."); return; }
    setSaving(true); setError("");
    const payload = {
      vehicle_id:         form.vehicle_id,
      start_at:           new Date(form.start_at).toISOString(),
      end_at:             new Date(form.end_at).toISOString(),
      pickup_location:    form.pickup_location.trim() || null,
      return_location:    form.return_location.trim() || null,
      child_seat_infant:  form.child_seat_infant,
      child_seat_toddler: form.child_seat_toddler,
      child_seat_child:   form.child_seat_child,
      insurance:          form.insurance as Insurance,
      booking_price:      form.booking_price  ? parseFloat(form.booking_price)  : null,
      deposit_amount:     form.deposit_amount ? parseFloat(form.deposit_amount) : null,
      deposit_paid:       form.deposit_paid,
      payment_method:     (form.payment_method || null) as PaymentMethod | null,
      notes:              form.notes.trim() || null,
      updated_at:         new Date().toISOString(),
    };
    const { error: err } = await getAuthBrowserClient().from("bookings").update(payload).eq("id", booking.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onUpdated(booking.id, { ...payload, start_at: payload.start_at, end_at: payload.end_at });
    onClose();
  }

  async function handleCancel() {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(true);
    await getAuthBrowserClient().from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", booking.id);
    onUpdated(booking.id, { status: "cancelled" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            {isMaintenance ? (
              <p className="text-base font-semibold text-slate-700">🔧 Maintenance block</p>
            ) : (
              <p className="text-base font-semibold text-neutral-900">{booking.customer_name ?? "—"}</p>
            )}
            {!isMaintenance && booking.customer_phone && (
              <a href={`tel:${booking.customer_phone}`}
                className="mt-0.5 flex items-center gap-1 text-sm text-brand-700 hover:underline">
                📞 {booking.customer_phone}
              </a>
            )}
            {isMaintenance && null}
          </div>
          <div className="flex items-center gap-3">
            <a href={`/app/rentals/${companyId}/${booking.id}`}
              className="text-xs text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline">
              Full edit →
            </a>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Pickup</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">Date & time</label>
                <CalDateTimeInput value={form.start_at}
                  onChange={(v) => setForm((p) => ({ ...p, start_at: v }))} className={INP} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Location</label>
                <input name="pickup_location" value={form.pickup_location} onChange={setField}
                  placeholder="e.g. Airport" className={INP} />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Return</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">Date & time</label>
                <CalDateTimeInput value={form.end_at}
                  onChange={(v) => setForm((p) => ({ ...p, end_at: v }))} className={INP} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Location</label>
                <input name="return_location" value={form.return_location} onChange={setField}
                  placeholder="e.g. Main office" className={INP} />
              </div>
            </div>
            {days && <p className="mt-1.5 text-xs text-neutral-400">Duration: <span className="font-semibold text-neutral-700">{days} {days === 1 ? "day" : "days"}</span></p>}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Car</p>
            <VehicleSelect
              value={form.vehicle_id}
              onChange={(id) => setForm((p) => ({ ...p, vehicle_id: id }))}
              vehicles={vehicles}
              allBookings={allBookings}
              excludeBookingId={booking.id}
              startAt={form.start_at}
              endAt={form.end_at}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Extras</p>
            <div className="space-y-2">
              {([
                { name: "child_seat_infant",  label: "Infant seat (0–1 y)" },
                { name: "child_seat_toddler", label: "Toddler seat (1–6 y)" },
                { name: "child_seat_child",   label: "Child seat (6–12 y)" },
              ] as const).map((s) => (
                <label key={s.name} className="flex cursor-pointer items-center gap-2.5">
                  <input type="checkbox" name={s.name} checked={form[s.name]} onChange={setField}
                    className="h-4 w-4 rounded border-border text-brand-700" />
                  <span className="text-sm text-neutral-700">{s.label}</span>
                </label>
              ))}
              <div className="pt-1">
                <label className="block text-xs font-medium text-neutral-600">Insurance</label>
                <select name="insurance" value={form.insurance} onChange={setField} className={INP}>
                  <option value="none">No insurance</option>
                  <option value="partial">Partial</option>
                  <option value="full">Full</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Payment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">Booking price (€)</label>
                <input name="booking_price" type="number" min={0} step={0.01} value={form.booking_price}
                  onChange={setField} placeholder="0.00" className={INP} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Deposit (€)</label>
                <input name="deposit_amount" type="number" min={0} step={0.01} value={form.deposit_amount}
                  onChange={setField} placeholder="0.00" className={INP} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" name="deposit_paid" checked={form.deposit_paid} onChange={setField}
                  className="h-4 w-4 rounded border-border text-brand-700" />
                Deposit received
              </label>
              <div className="flex-1">
                <select name="payment_method" value={form.payment_method} onChange={setField} className={INP}>
                  <option value="">Payment method…</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Notes</p>
            <textarea name="notes" rows={2} value={form.notes} onChange={setField}
              placeholder="Anything the team should know…" className={INP} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <button onClick={handleSave} disabled={saving || cancelling}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button onClick={handleCancel} disabled={cancelling || saving}
            className="text-sm text-red-500 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-50">
            {cancelling ? "Cancelling…" : "Cancel booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sortable vehicle row label ──────────────────────────────────────────────

function SortableVehicleLabel({ vehicle, index, total }: { vehicle: Vehicle; index: number; total: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: vehicle.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, minWidth: 140 }}
      className={`flex h-9 items-center gap-1.5 px-2 ${index < total - 1 ? "border-b border-border" : ""}`}
    >
      <button
        {...listeners} {...attributes}
        className="cursor-grab touch-none p-0.5 text-neutral-200 hover:text-neutral-400 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
          <circle cx="3" cy="7"   r="1.2"/><circle cx="7" cy="7"   r="1.2"/>
          <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
        </svg>
      </button>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-neutral-900 leading-tight">{vehicle.make} {vehicle.model}</p>
        <p className="font-mono text-[10px] text-neutral-400 leading-tight">{vehicle.plate}</p>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface Selection {
  vehicleId: string;
  startStr: string;
  endStr: string;
}

interface NewBookingTarget {
  vehicleId: string;
  startStr: string;
  endStr: string;
}

interface TooltipState {
  lines: string[];
  x: number;
  y: number;
}

export function CalendarGrid({ companyId, vehicles: initialVehicles, bookings: initialBookings }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toStr(today);

  // Responsive day width
  const [DAY_W, setDayW] = useState(DAY_W_DESKTOP);
  useEffect(() => {
    function update() { setDayW(getDayW()); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const storageKey = `cal-vehicle-order-${companyId}`;
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window === "undefined") return initialVehicles;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return initialVehicles;
      const savedIds: string[] = JSON.parse(saved);
      const rank = (id: string) => { const i = savedIds.indexOf(id); return i === -1 ? Infinity : i; };
      return [...initialVehicles].sort((a, b) => rank(a.id) - rank(b.id));
    } catch { return initialVehicles; }
  });

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  // Popups
  const [activeBooking,    setActiveBooking]    = useState<Booking | null>(null);
  const [tooltip,          setTooltip]          = useState<TooltipState | null>(null);
  const [newBookingTarget, setNewBookingTarget] = useState<NewBookingTarget | null>(null);
  const [showNewPopup,     setShowNewPopup]     = useState(false);

  // Drag-to-select state
  const [selection,   setSelection]   = useState<Selection | null>(null);
  const isDraggingRef = useRef(false);

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = addDays(today, i - DAYS_PAST);
    return { date: d, str: toStr(d) };
  });

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft = (DAYS_PAST - SCROLL_OFFSET) * getDayW();
  }, []);

  // Global mouseup — finalize selection and open create popup
  useEffect(() => {
    function handleMouseUp() {
      if (isDraggingRef.current && selection) {
        const s = selection.startStr <= selection.endStr ? selection.startStr : selection.endStr;
        const e = selection.startStr <= selection.endStr ? selection.endStr   : selection.startStr;
        setNewBookingTarget({ vehicleId: selection.vehicleId, startStr: s, endStr: e });
      }
      isDraggingRef.current = false;
      setSelection(null);
    }
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [selection]);

  function scrollToToday() {
    scrollRef.current?.scrollTo({ left: (DAYS_PAST - SCROLL_OFFSET) * DAY_W, behavior: "smooth" });
  }



  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setVehicles((prev) => {
      const oldIndex = prev.findIndex((v) => v.id === active.id);
      const newIndex = prev.findIndex((v) => v.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      localStorage.setItem(storageKey, JSON.stringify(next.map((v) => v.id)));
      return next;
    });
  }

  const handleUpdated = useCallback((bookingId: string, changes: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => b.id === bookingId ? { ...b, ...changes } : b)
          .filter((b) => b.status !== "cancelled")
    );
  }, []);

  const handleCreated = useCallback((b: Booking) => {
    setBookings((prev) => [...prev, b]);
  }, []);

  const totalWidth = TOTAL_DAYS * DAY_W;

  return (
    <>
      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="fixed z-[200] pointer-events-none max-w-[220px] rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white shadow-xl"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          {tooltip.lines.map((line, i) => (
            <p key={i} className={i === 0 ? "font-semibold" : "text-neutral-300 mt-0.5"}>{line}</p>
          ))}
        </div>
      )}

      {/* Edit booking popup */}
      {activeBooking && (
        <BookingPopup
          booking={activeBooking}
          vehicles={vehicles}
          allBookings={bookings}
          companyId={companyId}
          onClose={() => setActiveBooking(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Create booking popup — from drag selection */}
      {newBookingTarget && (
        <CreateBookingPopup
          companyId={companyId}
          vehicles={vehicles}
          allBookings={bookings}
          preVehicleId={newBookingTarget.vehicleId}
          preStart={strToLocalDatetime(newBookingTarget.startStr, "10:00")}
          preEnd={strToLocalDatetime(strAddDay(newBookingTarget.endStr), "10:00")}
          onClose={() => setNewBookingTarget(null)}
          onCreated={handleCreated}
        />
      )}

      {/* Create booking popup — from button */}
      {showNewPopup && (
        <CreateBookingPopup
          companyId={companyId}
          vehicles={vehicles}
          allBookings={bookings}
          onClose={() => setShowNewPopup(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Controls */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setShowNewPopup(true)}
          className="rounded-lg bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-800">
          + New booking
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button onClick={() => scrollRef.current?.scrollBy({ left: -7 * DAY_W, behavior: "smooth" })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-slate-50">
          ← 1 week
        </button>
        <button onClick={scrollToToday}
          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100">
          Today
        </button>
        <button onClick={() => scrollRef.current?.scrollBy({ left: 7 * DAY_W, behavior: "smooth" })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-slate-50">
          1 week →
        </button>
        <span className="ml-auto text-xs text-neutral-400">Drag on a row to create · Click a booking to edit</span>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex">

          {/* Fixed vehicle column */}
          <div className="shrink-0 border-r border-border" style={{ minWidth: 140 }}>
            <div className="h-10 border-b border-border" />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={vehicles.map((v) => v.id)} strategy={verticalListSortingStrategy}>
                {vehicles.map((v, i) => (
                  <SortableVehicleLabel key={v.id} vehicle={v} index={i} total={vehicles.length} />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Scrollable day grid */}
          <div ref={scrollRef} className="flex-1 overflow-x-scroll select-none"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
            <div style={{ width: totalWidth }}>

              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-border bg-white" style={{ height: 40 }}>
                <div className="flex h-full">
                  {days.map(({ date, str }) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday   = str === todayStr;
                    const isFirst   = date.getDate() === 1;
                    return (
                      <div key={str} style={{ width: DAY_W }}
                        className={`relative flex shrink-0 flex-col items-center justify-center border-r border-border/30
                          ${isToday ? "bg-brand-500" : isWeekend ? "bg-slate-50" : ""}`}>
                        {isFirst && (
                          <span className="absolute -top-px left-0.5 text-[8px] font-bold uppercase text-neutral-400">
                            {MONTH_SHORT[date.getMonth()]}
                          </span>
                        )}
                        <span className={`text-[9px] font-medium leading-none ${isToday ? "text-white" : "text-neutral-400"}`}>
                          {DAY_SHORT[date.getDay()]}
                        </span>
                        <span className={`mt-0.5 text-[11px] font-bold leading-none ${isToday ? "text-white" : isWeekend ? "text-neutral-500" : "text-neutral-700"}`}>
                          {date.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle rows — compact */}
              {vehicles.map((v, vi) => {
                const vBookings = bookings.filter(
                  (b) => b.vehicle_id === v.id && b.status !== "cancelled"
                );
                const rangeStart = days[0]!.str;
                const rangeEnd   = days[days.length - 1]!.str;

                const selMin = selection && selection.vehicleId === v.id
                  ? (selection.startStr <= selection.endStr ? selection.startStr : selection.endStr) : null;
                const selMax = selection && selection.vehicleId === v.id
                  ? (selection.startStr <= selection.endStr ? selection.endStr : selection.startStr) : null;

                return (
                  <div key={v.id}
                    className={`relative flex h-9 ${vi < vehicles.length - 1 ? "border-b border-border" : ""}`}>
                    {days.map(({ date, str }) => {
                      const isWeekend  = date.getDay() === 0 || date.getDay() === 6;
                      const isToday    = str === todayStr;
                      const isSelected = selMin && selMax && str >= selMin && str <= selMax;

                      return (
                        <div key={str}
                          style={{ width: DAY_W }}
                          className={`shrink-0 h-full border-r border-border/30 cursor-crosshair
                            ${isSelected   ? "bg-brand-100"        : ""}
                            ${!isSelected && isToday   ? "bg-brand-50/50"    : ""}
                            ${!isSelected && isWeekend ? "bg-slate-50/70"    : ""}
                          `}
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            e.preventDefault();
                            isDraggingRef.current = true;
                            setSelection({ vehicleId: v.id, startStr: str, endStr: str });
                          }}
                          onMouseEnter={() => {
                            if (!isDraggingRef.current || selection?.vehicleId !== v.id) return;
                            setSelection((prev) => prev ? { ...prev, endStr: str } : prev);
                          }}
                        />
                      );
                    })}

                    {/* Inspection / insurance markers — full cell */}
                    {[
                      { date: v.gov_inspection_next,  color: "bg-yellow-300", title: "Gov. inspection due" },
                      { date: v.service_next,          color: "bg-blue-300",   title: "Service due" },
                      { date: v.insurance_valid_until, color: "bg-emerald-300", title: "Insurance expires" },
                    ].map(({ date, color, title }) => {
                      if (!date) return null;
                      const markerStr = date.slice(0, 10);
                      const idx = days.findIndex((d) => d.str === markerStr);
                      if (idx === -1) return null;
                      const fmtDate = new Date(markerStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                      return (
                        <div
                          key={title}
                          style={{ left: idx * DAY_W, width: DAY_W }}
                          className={`absolute inset-y-0 ${color} z-[5] opacity-70 cursor-help`}
                          onMouseEnter={(e) => setTooltip({ lines: [title, fmtDate], x: e.clientX, y: e.clientY })}
                          onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                          onMouseLeave={()  => setTooltip(null)}
                        />
                      );
                    })}

                    {/* Booking blocks */}
                    {vBookings.map((b) => {
                      const startStr = b.start_at.slice(0, 10);
                      const endStr   = b.end_at.slice(0, 10);
                      if (startStr > rangeEnd || endStr <= rangeStart) return null;

                      const visStart = startStr < rangeStart ? rangeStart : startStr;
                      const visEnd   = endStr   > rangeEnd   ? rangeEnd   : endStr;
                      const startIdx = days.findIndex((d) => d.str === visStart);
                      const endIdx   = days.findIndex((d) => d.str === visEnd);
                      if (startIdx === -1) return null;
                      const span = endIdx === -1 ? days.length - startIdx : Math.max(1, endIdx - startIdx);

                      const colorBg   = STATUS_COLOR[b.status] ?? "bg-neutral-200";
                      const colorText = STATUS_TEXT[b.status]  ?? "text-neutral-700";
                      const clipsLeft  = startStr < rangeStart;
                      const clipsRight = endStr   > rangeEnd;

                      const blockColor = b.is_maintenance
                        ? "bg-slate-400 hover:bg-slate-500 text-white"
                        : `${colorBg} ${colorText}`;
                      const blockLabel = b.is_maintenance
                        ? "🔧 Maintenance"
                        : (b.customer_name ?? "—");

                      const fmtDt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
                      const tipLines = b.is_maintenance
                        ? ["🔧 Maintenance block", `${fmtDt(b.start_at)} → ${fmtDt(b.end_at)}`, ...(b.notes ? [b.notes] : [])]
                        : [
                            b.customer_name ?? "—",
                            ...(b.customer_phone ? [`📞 ${b.customer_phone}`] : []),
                            `${fmtDt(b.start_at)} → ${fmtDt(b.end_at)}`,
                            ...(b.pickup_location ? [`↑ ${b.pickup_location}`] : []),
                            ...(b.return_location ? [`↓ ${b.return_location}`] : []),
                            ...(b.booking_price != null ? [`€${b.booking_price.toFixed(2)}`] : []),
                          ];

                      return (
                        <button
                          key={b.id}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setActiveBooking(b)}
                          onMouseEnter={(e) => setTooltip({ lines: tipLines, x: e.clientX, y: e.clientY })}
                          onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                          onMouseLeave={()  => setTooltip(null)}
                          style={{
                            left:  startIdx * DAY_W + 2,
                            width: span    * DAY_W - 4,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          className={`absolute flex h-6 items-center overflow-hidden px-1.5 text-[11px] font-medium transition-opacity hover:opacity-80 cursor-pointer z-10
                            ${blockColor}
                            ${!clipsLeft  ? "rounded-l-md" : ""}
                            ${!clipsRight ? "rounded-r-md" : ""}
                          `}
                        >
                          <span className="truncate">{blockLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {vehicles.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-neutral-400">
                  No cars in your fleet.{" "}
                  <Link href={`/app/fleet/${companyId}/add`} className="text-brand-700 hover:underline">Add one →</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3">
          {[
            { label: "Confirmed",    color: "bg-amber-400",   square: true },
            { label: "Active",       color: "bg-emerald-500", square: true },
            { label: "Returned",     color: "bg-neutral-300", square: true },
            { label: "Maintenance",  color: "bg-slate-400",   square: true },
            { label: "Today",        color: "bg-brand-500",   square: true },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${l.color}`} />
              <span className="text-xs text-neutral-500">{l.label}</span>
            </div>
          ))}
          <div className="mx-1 h-4 w-px bg-border" />
          {[
            { label: "Gov. inspection", color: "bg-yellow-300"  },
            { label: "Service due",     color: "bg-blue-300"    },
            { label: "Insurance exp.",  color: "bg-emerald-300" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`h-3 w-4 rounded-sm ${l.color} opacity-70`} />
              <span className="text-xs text-neutral-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CalDateTimeInput({ value, onChange, className }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [datePart, timePart] = value ? value.split("T") : ["", ""];
  return (
    <div className="flex gap-1.5">
      <input type="date" value={datePart ?? ""}
        onChange={(e) => onChange(`${e.target.value}T${timePart ?? "00:00"}`)}
        className={`flex-1 ${className ?? ""}`} />
      <input type="time" value={timePart ?? ""}
        onChange={(e) => onChange(`${datePart ?? ""}T${e.target.value}`)}
        className={`w-24 ${className ?? ""}`} />
    </div>
  );
}
