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
  customer_name: string;
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
}

interface Props {
  companyId: string;
  vehicles: Vehicle[];
  bookings: Booking[];
}

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-amber-400 hover:bg-amber-500",
  active:    "bg-emerald-500 hover:bg-emerald-600",
  returned:  "bg-neutral-300 hover:bg-neutral-400",
};
const STATUS_TEXT: Record<string, string> = {
  confirmed: "text-amber-900",
  active:    "text-white",
  returned:  "text-neutral-600",
};

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_SHORT   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const DAY_W       = 44;
const DAYS_PAST   = 60;
const DAYS_FUTURE = 90;
const TOTAL_DAYS  = DAYS_PAST + 1 + DAYS_FUTURE;
const SCROLL_OFFSET = 7;

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function toStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ── Booking popup ───────────────────────────────────────────────────────────

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000*60*60*24)));
}

interface BookingPopupProps {
  booking: Booking;
  vehicles: Vehicle[];
  allBookings: Booking[];
  companyId: string;
  onClose: () => void;
  onUpdated: (bookingId: string, changes: Partial<Booking>) => void;
}

function BookingPopup({ booking, vehicles, allBookings, companyId, onClose, onUpdated }: BookingPopupProps) {
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
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError]  = useState("");

  function setField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  const days = (() => {
    const s = new Date(form.start_at).getTime();
    const e = new Date(form.end_at).getTime();
    return (isNaN(s) || isNaN(e) || e <= s) ? null : Math.ceil((e - s) / (1000*60*60*24));
  })();

  // Vehicles available for selected dates (excluding current booking)
  const availableVehicles = vehicles.filter((v) => {
    if (v.id === form.vehicle_id) return true;
    const conflicts = allBookings.filter(
      (b) => b.id !== booking.id &&
             b.vehicle_id === v.id &&
             b.status !== "cancelled" &&
             b.start_at < new Date(form.end_at).toISOString() &&
             b.end_at   > new Date(form.start_at).toISOString()
    );
    return conflicts.length === 0;
  });
  const unavailableVehicles = vehicles.filter((v) => !availableVehicles.find((a) => a.id === v.id));

  async function handleSave() {
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setError("Return must be after pickup."); return;
    }
    setSaving(true); setError("");
    const supabase = getAuthBrowserClient();
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
    const { error: err } = await supabase.from("bookings").update(payload).eq("id", booking.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onUpdated(booking.id, { ...payload, start_at: payload.start_at, end_at: payload.end_at });
    onClose();
  }

  async function handleCancel() {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(true);
    await getAuthBrowserClient().from("bookings").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", booking.id);
    onUpdated(booking.id, { status: "cancelled" });
    onClose();
  }

  const inp = "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-base font-semibold text-neutral-900">{booking.customer_name}</p>
            {booking.customer_phone && (
              <a href={`tel:${booking.customer_phone}`}
                className="mt-0.5 flex items-center gap-1 text-sm text-brand-700 hover:underline">
                📞 {booking.customer_phone}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a href={`/app/rentals/${companyId}/${booking.id}`}
              className="text-xs text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline">
              Full edit →
            </a>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">✕</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Pickup */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Pickup</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">Date & time</label>
                <input name="start_at" type="datetime-local" value={form.start_at} onChange={setField} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Location</label>
                <input name="pickup_location" value={form.pickup_location} onChange={setField}
                  placeholder="e.g. Airport" className={inp} />
              </div>
            </div>
          </div>

          {/* Return */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Return</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">Date & time</label>
                <input name="end_at" type="datetime-local" value={form.end_at} onChange={setField} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Location</label>
                <input name="return_location" value={form.return_location} onChange={setField}
                  placeholder="e.g. Main office" className={inp} />
              </div>
            </div>
            {days && <p className="mt-1.5 text-xs text-neutral-400">Duration: <span className="font-semibold text-neutral-700">{days} {days === 1 ? "day" : "days"}</span></p>}
          </div>

          {/* Vehicle */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Vehicle</p>
            <select name="vehicle_id" value={form.vehicle_id} onChange={setField} className={inp}>
              <optgroup label="Available on these dates">
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} — {v.plate}{v.id === booking.vehicle_id ? " (current)" : ""}
                  </option>
                ))}
              </optgroup>
              {unavailableVehicles.length > 0 && (
                <optgroup label="Booked (unavailable)">
                  {unavailableVehicles.map((v) => (
                    <option key={v.id} value={v.id} disabled>
                      {v.make} {v.model} — {v.plate}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
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
                <select name="insurance" value={form.insurance} onChange={setField} className={inp}>
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
                  onChange={setField} placeholder="0.00" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">Deposit (€)</label>
                <input name="deposit_amount" type="number" min={0} step={0.01} value={form.deposit_amount}
                  onChange={setField} placeholder="0.00" className={inp} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" name="deposit_paid" checked={form.deposit_paid} onChange={setField}
                  className="h-4 w-4 rounded border-border text-brand-700" />
                Deposit received
              </label>
              <div className="flex-1">
                <select name="payment_method" value={form.payment_method} onChange={setField} className={inp}>
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
              placeholder="Anything the team should know…" className={inp} />
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
      style={{ ...style, minWidth: 180 }}
      className={`flex h-14 items-center gap-2 px-3 ${index < total - 1 ? "border-b border-border" : ""}`}
    >
      <button
        {...listeners} {...attributes}
        className="cursor-grab touch-none p-1 text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="4" cy="3"  r="1.5"/><circle cx="8" cy="3"  r="1.5"/>
          <circle cx="4" cy="8"  r="1.5"/><circle cx="8" cy="8"  r="1.5"/>
          <circle cx="4" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
        </svg>
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-900 leading-tight">{vehicle.make} {vehicle.model}</p>
        <p className="font-mono text-xs text-neutral-400">{vehicle.plate}</p>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function CalendarGrid({ companyId, vehicles: initialVehicles, bookings: initialBookings }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toStr(today);

  // Vehicle order — persisted to localStorage
  const storageKey = `cal-vehicle-order-${companyId}`;
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window === "undefined") return initialVehicles;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return initialVehicles;
      const savedIds: string[] = JSON.parse(saved);
      const sorted = [...initialVehicles].sort(
        (a, b) => savedIds.indexOf(a.id) - savedIds.indexOf(b.id)
      );
      return sorted;
    } catch { return initialVehicles; }
  });

  // Bookings — mutable for reassignment
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  // Reassign popup
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = addDays(today, i - DAYS_PAST);
    return { date: d, str: toStr(d) };
  });

  // Scroll to today − SCROLL_OFFSET on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft = (DAYS_PAST - SCROLL_OFFSET) * DAY_W;
  }, []);

  function scrollToToday() {
    scrollRef.current?.scrollTo({ left: (DAYS_PAST - SCROLL_OFFSET) * DAY_W, behavior: "smooth" });
  }

  // DnD sensors
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
      prev
        .map((b) => b.id === bookingId ? { ...b, ...changes } : b)
        .filter((b) => b.status !== "cancelled")
    );
  }, []);

  const totalWidth = TOTAL_DAYS * DAY_W;

  return (
    <>
      {/* Reassign popup */}
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

      {/* Controls */}
      <div className="mb-4 flex items-center gap-3">
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
        <span className="ml-2 text-xs text-neutral-400">Drag ⠿ to reorder vehicles · Click a booking to move it</span>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex">

          {/* Fixed vehicle column — sortable */}
          <div className="shrink-0 border-r border-border" style={{ minWidth: 180 }}>
            <div className="h-14 border-b border-border" />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={vehicles.map((v) => v.id)} strategy={verticalListSortingStrategy}>
                {vehicles.map((v, i) => (
                  <SortableVehicleLabel key={v.id} vehicle={v} index={i} total={vehicles.length} />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Scrollable day grid */}
          <div ref={scrollRef} className="flex-1 overflow-x-scroll"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
            <div style={{ width: totalWidth }}>

              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-border bg-white" style={{ height: 56 }}>
                <div className="flex" style={{ height: 24 }}>
                  {days.map(({ date, str }) => (
                    <div key={str} style={{ width: DAY_W }}
                      className={`shrink-0 border-r border-border/30 ${str === todayStr ? "bg-brand-50" : ""}`}>
                      {date.getDate() === 1 && (
                        <span className="block truncate pl-1.5 pt-1 text-[11px] font-semibold text-neutral-500">
                          {MONTH_SHORT[date.getMonth()]} {date.getFullYear()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex" style={{ height: 32 }}>
                  {days.map(({ date, str }) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday   = str === todayStr;
                    return (
                      <div key={str} style={{ width: DAY_W }}
                        className={`flex shrink-0 flex-col items-center justify-center border-r border-border/30
                          ${isToday ? "bg-brand-500" : isWeekend ? "bg-slate-50" : ""}`}>
                        <span className={`text-[10px] font-medium leading-none ${isToday ? "text-white" : "text-neutral-400"}`}>
                          {DAY_SHORT[date.getDay()]}
                        </span>
                        <span className={`mt-0.5 text-xs font-bold leading-none ${isToday ? "text-white" : isWeekend ? "text-neutral-400" : "text-neutral-700"}`}>
                          {date.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle rows */}
              {vehicles.map((v, vi) => {
                const vBookings = bookings.filter(
                  (b) => b.vehicle_id === v.id && b.status !== "cancelled"
                );
                const rangeStart = days[0]!.str;
                const rangeEnd   = days[days.length - 1]!.str;

                return (
                  <div key={v.id}
                    className={`relative flex h-14 ${vi < vehicles.length - 1 ? "border-b border-border" : ""}`}>
                    {days.map(({ date, str }) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday   = str === todayStr;
                      return (
                        <div key={str} style={{ width: DAY_W }}
                          className={`shrink-0 h-full border-r border-border/30
                            ${isToday ? "bg-brand-50/50" : isWeekend ? "bg-slate-50/70" : ""}`}
                        />
                      );
                    })}

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

                      return (
                        <button
                          key={b.id}
                          onClick={() => setActiveBooking(b)}
                          title={`${b.customer_name} · Click to move to another vehicle`}
                          style={{
                            left:  startIdx * DAY_W + 2,
                            width: span    * DAY_W - 4,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          className={`absolute flex h-8 items-center overflow-hidden px-2 text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer
                            ${colorBg} ${colorText}
                            ${!clipsLeft  ? "rounded-l-md" : ""}
                            ${!clipsRight ? "rounded-r-md" : ""}
                          `}
                        >
                          <span className="truncate">{b.customer_name}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {vehicles.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-neutral-400">
                  No vehicles in your fleet.{" "}
                  <Link href={`/app/fleet/${companyId}/add`} className="text-brand-700 hover:underline">Add one →</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 border-t border-border px-4 py-3">
          {[
            { label: "Confirmed", color: "bg-amber-400" },
            { label: "Active",    color: "bg-emerald-500" },
            { label: "Returned",  color: "bg-neutral-300" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${l.color}`} />
              <span className="text-xs text-neutral-500">{l.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-brand-500" />
            <span className="text-xs text-neutral-500">Today</span>
          </div>
        </div>
      </div>
    </>
  );
}
