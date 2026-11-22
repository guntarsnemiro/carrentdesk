"use client";

import { useRef, useEffect, useState, useCallback, type ReactNode } from "react";
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
import { cancelBooking, type CancelReason } from "@/lib/booking/cancel-booking";
import { formatEur } from "@/lib/booking/money";
import { DateInput } from "@/components/ui/date-input";

type Insurance     = "none" | "partial" | "full";
type PaymentMethod = "cash" | "card" | "bank_transfer" | "other";

interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  is_maintenance: boolean;
  is_longterm: boolean;
  renewal_period_days: number | null;
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
  flight_number?: string | null;
  customer_request?: string | null;
  fee_paid_at?: string | null;
  fee_refunded_at?: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate: string | null;
  status: string;
  gov_inspection_next: string | null;
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
  locationPresets?: string[];
}

const STATUS_COLOR: Record<string, string> = {
  confirmed:       "bg-amber-400/90 hover:bg-amber-400",
  active:          "bg-emerald-500/90 hover:bg-emerald-500",
  returned:        "bg-neutral-200 hover:bg-neutral-300",
  maintenance:     "bg-slate-400/90 hover:bg-slate-400",
  pending_payment: "bg-sky-400/90 hover:bg-sky-400",
};
const STATUS_TEXT: Record<string, string> = {
  confirmed:       "text-amber-950",
  active:          "text-white",
  returned:        "text-neutral-600",
  maintenance:     "text-white",
  pending_payment: "text-sky-950",
};

/** Online marketplace booking: pending card hold or confirmation fee paid. */
function isOnlineBooking(b: Pick<Booking, "fee_paid_at" | "status">) {
  return b.status === "pending_payment" || Boolean(b.fee_paid_at);
}

function SidePanel({
  title,
  subtitle,
  badge,
  onClose,
  footer,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25" />
      <div
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-neutral-900">{title}</p>
              {badge}
            </div>
            {subtitle ? <div className="mt-1">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">{children}</div>
        <div className="border-t border-border px-5 py-4">{footer}</div>
      </div>
    </div>
  );
}

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
  locationPresets?: string[];
}

function CreateBookingPopup({
  companyId, vehicles, allBookings, preVehicleId, preStart, preEnd, onClose, onCreated, locationPresets = [],
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
    <SidePanel
      title="New booking"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {saving ? "Saving…" : "Create booking"}
          </button>
          <button type="button" onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-700">
            Cancel
          </button>
        </div>
      }
    >
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
              Maintenance block
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
                {locationPresets.length > 0 && <datalist id="cal-loc-presets-new">{locationPresets.map((p) => <option key={p} value={p} />)}</datalist>}
                <input name="pickup_location" value={form.pickup_location} onChange={setField}
                  list={locationPresets.length > 0 ? "cal-loc-presets-new" : undefined}
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
                  list={locationPresets.length > 0 ? "cal-loc-presets-new" : undefined}
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
                  <option value="none">Basic</option>
                  {form.insurance === "partial" && <option value="partial">Partial</option>}
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
    </SidePanel>
  );
}

// ── Edit booking panel ───────────────────────────────────────────────────────

interface BookingPopupProps {
  booking: Booking;
  vehicles: Vehicle[];
  allBookings: Booking[];
  companyId: string;
  onClose: () => void;
  onUpdated: (bookingId: string, changes: Partial<Booking>) => void;
  locationPresets?: string[];
}

function BookingPopup({ booking, vehicles, allBookings, companyId, onClose, onUpdated, locationPresets = [] }: BookingPopupProps) {
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

  async function cancelWith(reason: CancelReason) {
    const feeHeld = Boolean(booking.fee_paid_at) && !booking.fee_refunded_at;
    const refunds = reason !== "customer" && feeHeld;
    const question = refunds
      ? "Cancel this booking and refund the customer?"
      : feeHeld
        ? "Mark this booking as cancelled by the customer? Their card payment is not refunded."
        : "Cancel this booking?";
    if (!confirm(question)) return;
    setCancelling(true);
    setError("");
    try {
      await cancelBooking(companyId, booking.id, reason);
      onUpdated(booking.id, { status: "cancelled" });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel the booking.");
      setCancelling(false);
    }
  }

  async function handleCancel() {
    if (booking.is_maintenance) {
      if (!confirm("Cancel this block?")) return;
      setCancelling(true);
      await getAuthBrowserClient().from("bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", booking.id);
      onUpdated(booking.id, { status: "cancelled" });
      onClose();
      return;
    }
    await cancelWith("operator");
  }

  const online = isOnlineBooking(booking);

  return (
    <SidePanel
      title={isMaintenance ? "Maintenance block" : (booking.customer_name ?? "Booking")}
      badge={
        online ? (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
            {booking.status === "pending_payment" ? "Online · awaiting card" : "Online"}
          </span>
        ) : null
      }
      subtitle={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {!isMaintenance && booking.customer_phone ? (
            <a href={`tel:${booking.customer_phone}`} className="text-sm text-brand-700 hover:underline">
              {booking.customer_phone}
            </a>
          ) : null}
          <a
            href={`/app/rentals/${companyId}/${booking.id}`}
            className="text-xs text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline"
          >
            Full edit →
          </a>
        </div>
      }
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button onClick={handleSave} disabled={saving || cancelling}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {booking.fee_paid_at && !booking.fee_refunded_at ? (
            <div className="flex flex-col items-end gap-1">
              <button type="button" onClick={() => cancelWith("operator")} disabled={cancelling || saving}
                className="text-sm font-medium text-neutral-900 underline-offset-2 hover:underline disabled:opacity-50">
                {cancelling ? "Cancelling…" : "Cancel — refund"}
              </button>
              <button type="button" onClick={() => cancelWith("customer")} disabled={cancelling || saving}
                className="text-sm text-red-500 underline-offset-2 hover:underline disabled:opacity-50">
                Customer cancelled — keep fee
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleCancel} disabled={cancelling || saving}
              className="text-sm text-red-500 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-50">
              {cancelling ? "Cancelling…" : "Cancel booking"}
            </button>
          )}
        </div>
      }
    >
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
                {locationPresets.length > 0 && <datalist id="cal-loc-presets-edit">{locationPresets.map((p) => <option key={p} value={p} />)}</datalist>}
                <input name="pickup_location" value={form.pickup_location} onChange={setField}
                  list={locationPresets.length > 0 ? "cal-loc-presets-edit" : undefined}
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
                  list={locationPresets.length > 0 ? "cal-loc-presets-edit" : undefined}
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
                  <option value="none">Basic</option>
                  {form.insurance === "partial" && <option value="partial">Partial</option>}
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

          {online && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Online booking</p>
              <p className="mt-1">
                {booking.status === "pending_payment"
                  ? "Customer started checkout — confirmation fee not paid yet."
                  : booking.fee_refunded_at
                    ? "Confirmation fee was paid, then refunded."
                    : "Confirmation fee paid by card."}
              </p>
              {booking.flight_number ? <p className="mt-1">Flight {booking.flight_number}</p> : null}
              {booking.customer_request ? (
                <p className="mt-1 whitespace-pre-wrap text-sky-900/80">{booking.customer_request}</p>
              ) : null}
            </div>
          )}
          {!online && (booking.flight_number || booking.customer_request) && (
            <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">From the customer</p>
              {booking.flight_number && <p>Flight {booking.flight_number}</p>}
              {booking.customer_request && <p className="whitespace-pre-wrap">{booking.customer_request}</p>}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Internal notes</p>
            <textarea name="notes" rows={2} value={form.notes} onChange={setField}
              placeholder="Anything the team should know…" className={INP} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
    </SidePanel>
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
      className={`flex h-10 items-center gap-1.5 px-2.5 ${index < total - 1 ? "border-b border-border" : ""}`}
    >
      <button
        {...listeners} {...attributes}
        className="cursor-grab touch-none p-0.5 text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
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

export function CalendarGrid({ companyId, vehicles: initialVehicles, bookings: initialBookings, locationPresets = [] }: Props) {
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
  const dayWRef       = useRef(DAY_W_DESKTOP); // kept in sync with DAY_W state

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = addDays(today, i - DAYS_PAST);
    return { date: d, str: toStr(d) };
  });
  // ref copy of days so global handlers don't need deps
  const daysRef = useRef(days);
  useEffect(() => { daysRef.current = days; });
  useEffect(() => { dayWRef.current = DAY_W; }, [DAY_W]);

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

  // Auto-scroll + extend selection while dragging past visible edges
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animFrame: number | null = null;

    function cancelAnim() {
      if (animFrame !== null) { cancelAnimationFrame(animFrame); animFrame = null; }
    }

    function handleGlobalMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current) { cancelAnim(); return; }

      const rect = el!.getBoundingClientRect();
      const EDGE = 80;
      const MAX_SPEED = 12;

      // Update selection end based on absolute mouse position over the scroll container
      const rawIdx = Math.floor((e.clientX - rect.left + el!.scrollLeft) / dayWRef.current);
      const clampedIdx = Math.max(0, Math.min(daysRef.current.length - 1, rawIdx));
      const hoveredStr = daysRef.current[clampedIdx]?.str;
      if (hoveredStr) {
        setSelection((prev) => prev ? { ...prev, endStr: hoveredStr } : prev);
      }

      // Auto-scroll when near right or left edge
      cancelAnim();
      if (e.clientX > rect.right - EDGE) {
        const factor = Math.min(1, (e.clientX - (rect.right - EDGE)) / EDGE);
        const scroll = () => {
          el!.scrollLeft += Math.ceil(factor * MAX_SPEED);
          if (isDraggingRef.current) animFrame = requestAnimationFrame(scroll);
        };
        animFrame = requestAnimationFrame(scroll);
      } else if (e.clientX < rect.left + EDGE) {
        const factor = Math.min(1, ((rect.left + EDGE) - e.clientX) / EDGE);
        const scroll = () => {
          el!.scrollLeft -= Math.ceil(factor * MAX_SPEED);
          if (isDraggingRef.current) animFrame = requestAnimationFrame(scroll);
        };
        animFrame = requestAnimationFrame(scroll);
      }
    }

    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      cancelAnim();
    };
  }, []);

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
          locationPresets={locationPresets}
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
          preEnd={strToLocalDatetime(newBookingTarget.endStr, "10:00")}
          onClose={() => setNewBookingTarget(null)}
          onCreated={handleCreated}
          locationPresets={locationPresets}
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
          locationPresets={locationPresets}
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
        <button onClick={() => scrollRef.current?.scrollBy({ left: -30 * DAY_W, behavior: "smooth" })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-slate-50">
          ← 1 month
        </button>
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
        <button onClick={() => scrollRef.current?.scrollBy({ left: 30 * DAY_W, behavior: "smooth" })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-slate-50">
          1 month →
        </button>
        <span className="ml-auto hidden text-xs text-neutral-400 lg:inline">
          Drag a row to create · Click a booking for the side panel
        </span>
      </div>

      {/* Grid */}
      <div className="overflow-clip rounded-xl border border-border bg-white">
        <div className="flex">

          {/* Fixed vehicle column */}
          <div className="shrink-0 border-r border-border bg-neutral-50/40" style={{ minWidth: 148 }}>
            <div className="h-11 border-b border-border" />
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
            <div className="relative" style={{ width: totalWidth }}>

              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-border bg-white" style={{ height: 44 }}>
                <div className="flex h-full">
                  {days.map(({ date, str }) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday   = str === todayStr;
                    const isFirst   = date.getDate() === 1;
                    return (
                      <div key={str} style={{ width: DAY_W }}
                        className={`relative flex shrink-0 flex-col items-center justify-center border-r border-border/25
                          ${isToday ? "bg-brand-600" : isWeekend ? "bg-slate-50" : ""}`}>
                        {isFirst && (
                          <span className={`absolute left-0.5 top-0.5 text-[8px] font-bold uppercase ${isToday ? "text-white/70" : "text-neutral-400"}`}>
                            {MONTH_SHORT[date.getMonth()]}
                          </span>
                        )}
                        <span className={`text-[9px] font-medium leading-none ${isToday ? "text-white/80" : "text-neutral-400"}`}>
                          {DAY_SHORT[date.getDay()]}
                        </span>
                        <span className={`mt-0.5 text-[11px] font-bold leading-none ${isToday ? "text-white" : isWeekend ? "text-neutral-500" : "text-neutral-800"}`}>
                          {date.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Today vertical line across all rows */}
              {(() => {
                const todayIdx = days.findIndex((d) => d.str === todayStr);
                if (todayIdx < 0) return null;
                return (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 top-11 z-[6] w-px bg-brand-600/70"
                    style={{ left: todayIdx * DAY_W + DAY_W / 2 }}
                  />
                );
              })()}

              {/* Vehicle rows */}
              {vehicles.map((v, vi) => {
                const vBookings = bookings.filter(
                  (b) => b.vehicle_id === v.id && b.status !== "cancelled"
                );
                const rangeStart = days[0]!.str;
                const rangeEnd   = days[days.length - 1]!.str;

                // Build a set of days that are simultaneously a return AND a pickup for this vehicle
                const returnDays = new Set(vBookings.map((b) => b.end_at.slice(0, 10)));
                const pickupDays = new Set(vBookings.map((b) => b.start_at.slice(0, 10)));
                const splitDays  = new Set([...returnDays].filter((d) => pickupDays.has(d)));

                const selMin = selection && selection.vehicleId === v.id
                  ? (selection.startStr <= selection.endStr ? selection.startStr : selection.endStr) : null;
                const selMax = selection && selection.vehicleId === v.id
                  ? (selection.startStr <= selection.endStr ? selection.endStr : selection.startStr) : null;

                return (
                  <div key={v.id}
                    className={`relative flex h-10 ${vi < vehicles.length - 1 ? "border-b border-border" : ""}`}>
                    {days.map(({ date, str }) => {
                      const isWeekend  = date.getDay() === 0 || date.getDay() === 6;
                      const isToday    = str === todayStr;
                      const isSelected = selMin && selMax && str >= selMin && str <= selMax;
                      return (
                        <div key={str}
                          style={{ width: DAY_W }}
                          className={`shrink-0 h-full border-r border-border/25 cursor-crosshair
                            ${isSelected             ? "bg-brand-100"    : ""}
                            ${!isSelected && isToday  ? "bg-brand-50/40"  : ""}
                            ${!isSelected && !isToday && isWeekend ? "bg-slate-50/60" : ""}
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

                    {/* Gov. inspection marker only */}
                    {[
                      { date: v.gov_inspection_next,  color: "bg-yellow-300", title: "Gov. inspection due" },
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
                      if (startStr > rangeEnd || endStr < rangeStart) return null;

                      const visStart = startStr < rangeStart ? rangeStart : startStr;
                      const visEnd   = endStr   > rangeEnd   ? rangeEnd   : endStr;
                      const startIdx = days.findIndex((d) => d.str === visStart);
                      const endIdx   = days.findIndex((d) => d.str === visEnd);
                      if (startIdx === -1) return null;

                      // +1 so the bar reaches the actual return day (inclusive)
                      const span = endIdx === -1 ? days.length - startIdx : Math.max(1, endIdx - startIdx + 1);

                      const colorBg   = STATUS_COLOR[b.status] ?? "bg-neutral-200";
                      const colorText = STATUS_TEXT[b.status]  ?? "text-neutral-700";
                      const clipsLeft  = startStr < rangeStart;
                      const clipsRight = endStr   > rangeEnd;

                      const isLongTerm = b.is_longterm && !b.is_maintenance;
                      const online = !b.is_maintenance && isOnlineBooking(b);

                      const blockColor = b.is_maintenance
                        ? "bg-slate-400 hover:bg-slate-500 text-white"
                        : `${colorBg} ${colorText}`;
                      const blockLabel = b.is_maintenance
                        ? "Maintenance"
                        : `${isLongTerm ? "↻ " : ""}${b.customer_name ?? "—"}`;

                      const fmtDt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
                      const tipLines = b.is_maintenance
                        ? ["Maintenance block", `${fmtDt(b.start_at)} → ${fmtDt(b.end_at)}`, ...(b.notes ? [b.notes] : [])]
                        : [
                            b.customer_name ?? "—",
                            ...(online ? [b.status === "pending_payment" ? "Online · awaiting card" : "Online booking"] : []),
                            ...(b.customer_phone ? [b.customer_phone] : []),
                            `${fmtDt(b.start_at)} → ${fmtDt(b.end_at)}`,
                            ...(b.pickup_location ? [`↑ ${b.pickup_location}`] : []),
                            ...(b.return_location ? [`↓ ${b.return_location}`] : []),
                            ...(b.booking_price != null ? [formatEur(b.booking_price)] : []),
                          ];

                      // On a split day (same-day return + pickup):
                      // — return bar ends in the left half of that cell with a small gap
                      // — pickup bar starts in the right half of that cell with a small gap
                      const half = Math.floor(DAY_W / 2);
                      const isReturnOnSplitDay = endIdx !== -1 && splitDays.has(endStr);
                      const isPickupOnSplitDay  = splitDays.has(startStr);

                      let barLeft  = startIdx * DAY_W + 2;
                      let barWidth = span * DAY_W - 4;

                      if (isReturnOnSplitDay) {
                        barWidth = (span - 1) * DAY_W + half - 3;
                      }
                      if (isPickupOnSplitDay) {
                        barLeft  = startIdx * DAY_W + half + 1;
                        barWidth = span * DAY_W - half - 3;
                      }

                      const priceBit =
                        !b.is_maintenance && b.booking_price != null && barWidth >= DAY_W * 3
                          ? ` · ${formatEur(b.booking_price)}`
                          : "";

                      return (
                        <div key={b.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setActiveBooking(b)}
                          onMouseEnter={(e) => setTooltip({ lines: tipLines, x: e.clientX, y: e.clientY })}
                          onMouseMove={(e)  => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                          onMouseLeave={()  => setTooltip(null)}
                          style={{
                            left:  barLeft,
                            width: barWidth,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          className={`absolute z-10 flex h-7 items-center gap-1 overflow-hidden px-1.5 text-[11px] font-medium transition-opacity hover:opacity-90 cursor-pointer
                            ${blockColor}
                            ${online ? "ring-1 ring-inset ring-sky-700/40" : ""}
                            ${!clipsLeft  ? "rounded-l-md" : ""}
                            ${!clipsRight && !isLongTerm ? "rounded-r-md" : ""}
                          `}
                        >
                          {online ? (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-950/80"
                              title="Online booking"
                            />
                          ) : null}
                          <span className="truncate">{blockLabel}{priceBit}</span>
                        </button>

                        {/* Long-term: lighter "committed" tail extends to end of visible range */}
                        {isLongTerm && endIdx !== -1 && endIdx < days.length - 1 && (
                          <div
                            style={{
                              left: (endIdx + 1) * DAY_W,
                              width: (days.length - endIdx - 1) * DAY_W,
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                            className={`absolute z-10 flex h-7 items-center overflow-hidden rounded-r-md pl-1.5 text-[10px] font-medium opacity-35
                              ${blockColor}`}
                          >
                            <span className="truncate italic">committed</span>
                          </div>
                        )}
                        </div>
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3">
          {[
            { label: "Confirmed",   color: "bg-amber-400" },
            { label: "Active",      color: "bg-emerald-500" },
            { label: "Returned",    color: "bg-neutral-200" },
            { label: "Maintenance", color: "bg-slate-400" },
            { label: "Awaiting card", color: "bg-sky-400" },
            { label: "Today",       color: "bg-brand-600" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${l.color}`} />
              <span className="text-xs text-neutral-500">{l.label}</span>
            </div>
          ))}
          <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="flex h-2.5 w-5 items-center justify-center rounded-sm bg-amber-400 ring-1 ring-inset ring-sky-700/40">
              <span className="h-1 w-1 rounded-full bg-sky-950/80" />
            </span>
            <span className="text-xs text-neutral-500">Online booking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-yellow-300 opacity-70" />
            <span className="text-xs text-neutral-500">Gov. inspection</span>
          </div>
        </div>
      </div>
    </>
  );
}

const CAL_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const CAL_MINS  = ["00", "15", "30", "45"];

function CalTimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h = "08", m = "00"] = value ? value.split(":") : [];
  const nearestMin = CAL_MINS.reduce((a, b) => Math.abs(parseInt(b) - parseInt(m)) < Math.abs(parseInt(a) - parseInt(m)) ? b : a);
  const sel = "border border-border bg-white px-1.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-500";
  return (
    <div className="flex items-center gap-0.5 mt-1">
      <select value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className={`rounded-l-lg ${sel}`}>
        {CAL_HOURS.map((hh) => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span className="border-y border-border bg-white px-0.5 py-1.5 text-xs text-neutral-400">:</span>
      <select value={nearestMin} onChange={(e) => onChange(`${h}:${e.target.value}`)} className={`rounded-r-lg ${sel}`}>
        {CAL_MINS.map((mm) => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
}

function CalDateTimeInput({ value, onChange, className }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [datePart = "", timePart = "08:00"] = value ? value.split("T") : [];
  return (
    <div>
      <DateInput
        value={datePart}
        onChange={(d) => onChange(`${d}T${timePart}`)}
        className={`w-full ${className ?? ""}`}
      />
      <CalTimeSelect value={timePart} onChange={(t) => onChange(`${datePart}T${t}`)} />
    </div>
  );
}
