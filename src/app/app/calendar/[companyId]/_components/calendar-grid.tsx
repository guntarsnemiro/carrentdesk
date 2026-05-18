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

interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  customer_name: string;
  vehicle_id: string;
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

// ── Booking reassign popup ──────────────────────────────────────────────────

interface ReassignPopupProps {
  booking: Booking;
  vehicles: Vehicle[];
  bookings: Booking[];
  onClose: () => void;
  onReassigned: (bookingId: string, newVehicleId: string) => void;
}

function ReassignPopup({ booking, vehicles, bookings, onClose, onReassigned }: ReassignPopupProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(booking.vehicle_id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Vehicles that have no conflicting booking (excluding current booking)
  const available = vehicles.filter((v) => {
    if (v.id === booking.vehicle_id) return true; // current vehicle always shown
    const conflicts = bookings.filter(
      (b) => b.id !== booking.id &&
             b.vehicle_id === v.id &&
             b.status !== "cancelled" &&
             b.start_at < booking.end_at &&
             b.end_at   > booking.start_at
    );
    return conflicts.length === 0;
  });

  const unavailable = vehicles.filter((v) => !available.find((a) => a.id === v.id));

  async function handleSave() {
    if (selectedVehicleId === booking.vehicle_id) { onClose(); return; }
    setSaving(true);
    setError("");
    const supabase = getAuthBrowserClient();
    const { error: err } = await supabase
      .from("bookings")
      .update({ vehicle_id: selectedVehicleId, updated_at: new Date().toISOString() })
      .eq("id", booking.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onReassigned(booking.id, selectedVehicleId);
    onClose();
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">Move booking</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">✕</button>
        </div>

        <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <p className="font-medium text-neutral-900">{booking.customer_name}</p>
          <p className="mt-0.5 text-neutral-500">{fmt(booking.start_at)} → {fmt(booking.end_at)}</p>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Move to vehicle</label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <optgroup label="Available on these dates">
              {available.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} — {v.plate}
                  {v.id === booking.vehicle_id ? " (current)" : ""}
                </option>
              ))}
            </optgroup>
            {unavailable.length > 0 && (
              <optgroup label="Booked on these dates (unavailable)">
                {unavailable.map((v) => (
                  <option key={v.id} value={v.id} disabled>
                    {v.make} {v.model} — {v.plate}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
            {saving ? "Saving…" : "Move booking"}
          </button>
          <button onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-neutral-600 hover:bg-slate-50">
            Cancel
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

  const handleReassigned = useCallback((bookingId: string, newVehicleId: string) => {
    setBookings((prev) =>
      prev.map((b) => b.id === bookingId ? { ...b, vehicle_id: newVehicleId } : b)
    );
  }, []);

  const totalWidth = TOTAL_DAYS * DAY_W;

  return (
    <>
      {/* Reassign popup */}
      {activeBooking && (
        <ReassignPopup
          booking={activeBooking}
          vehicles={vehicles}
          bookings={bookings}
          onClose={() => setActiveBooking(null)}
          onReassigned={handleReassigned}
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
