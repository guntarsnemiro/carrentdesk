"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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
  initialYear: number;
  initialMonth: number; // 0-indexed
}

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-amber-400 hover:bg-amber-500",
  active:    "bg-emerald-500 hover:bg-emerald-600",
  returned:  "bg-neutral-300 hover:bg-neutral-400",
  cancelled: "bg-red-200 hover:bg-red-300",
};

const STATUS_TEXT: Record<string, string> = {
  confirmed: "text-amber-900",
  active:    "text-white",
  returned:  "text-neutral-500",
  cancelled: "text-red-600",
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(y: number, m: number, d: number) {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function bookingOverlapsDay(b: Booking, dayStr: string) {
  const start = b.start_at.slice(0, 10);
  const end   = b.end_at.slice(0, 10);
  return start <= dayStr && end > dayStr;
}

function bookingStartsOnDay(b: Booking, dayStr: string) {
  return b.start_at.slice(0, 10) === dayStr;
}

function bookingEndsOnDay(b: Booking, dayStr: string) {
  return b.end_at.slice(0, 10) === dayStr;
}

const DAY_W = 36; // px per day cell

export function CalendarGrid({ companyId, vehicles, bookings, initialYear, initialMonth }: Props) {
  const [year,  setYear]  = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today    = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const days = daysInMonth(year, month);
  const dayNums = Array.from({ length: days }, (_, i) => i + 1);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  // Scroll so today is visible
  useEffect(() => {
    if (!scrollRef.current) return;
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    if (isCurrentMonth) {
      const offset = (today.getDate() - 1) * DAY_W;
      scrollRef.current.scrollLeft = Math.max(0, offset - 80);
    } else {
      scrollRef.current.scrollLeft = 0;
    }
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div>
      {/* ── Controls ── */}
      <div className="mb-5 flex items-center gap-3">
        <button onClick={prevMonth}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-slate-50">
          ← Prev
        </button>
        <h2 className="min-w-[160px] text-center text-base font-semibold text-neutral-900">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button onClick={nextMonth}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-slate-50">
          Next →
        </button>
        {!isCurrentMonth && (
          <button onClick={goToday}
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100">
            Today
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {/* Sticky vehicle name column + scrollable day columns */}
        <div className="flex">

          {/* Vehicle labels — fixed left */}
          <div className="shrink-0 border-r border-border">
            {/* Header spacer */}
            <div className="flex h-10 items-end border-b border-border px-4 pb-2">
              <span className="text-xs font-medium text-neutral-400">Vehicle</span>
            </div>
            {vehicles.map((v, i) => (
              <div key={v.id}
                className={`flex h-14 items-center gap-2 px-4 ${i < vehicles.length - 1 ? "border-b border-border" : ""}`}>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{v.make} {v.model}</p>
                  <p className="font-mono text-xs text-neutral-400">{v.plate}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable day grid */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto">
            <div style={{ width: days * DAY_W, minWidth: "100%" }}>

              {/* Day header */}
              <div className="flex h-10 items-end border-b border-border">
                {dayNums.map((d) => {
                  const ds = toDateStr(year, month, d);
                  const date = new Date(year, month, d);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday   = ds === todayStr;
                  return (
                    <div key={d} style={{ width: DAY_W }}
                      className={`flex shrink-0 flex-col items-center justify-end pb-1.5 text-center
                        ${isToday ? "bg-brand-50" : isWeekend ? "bg-slate-50" : ""}`}>
                      <span className={`text-[10px] font-medium leading-none ${isToday ? "text-brand-700" : "text-neutral-400"}`}>
                        {["Su","Mo","Tu","We","Th","Fr","Sa"][date.getDay()]}
                      </span>
                      <span className={`mt-0.5 text-xs font-semibold leading-none
                        ${isToday ? "text-brand-700" : isWeekend ? "text-neutral-400" : "text-neutral-600"}`}>
                        {d}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Vehicle rows */}
              {vehicles.map((v, vi) => {
                const vBookings = bookings.filter((b) => b.vehicle_id === v.id && b.status !== "cancelled");

                return (
                  <div key={v.id}
                    className={`relative flex h-14 ${vi < vehicles.length - 1 ? "border-b border-border" : ""}`}>

                    {/* Day cells (background) */}
                    {dayNums.map((d) => {
                      const ds = toDateStr(year, month, d);
                      const date = new Date(year, month, d);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday   = ds === todayStr;
                      return (
                        <div key={d} style={{ width: DAY_W }}
                          className={`shrink-0 border-r border-border/50 h-full
                            ${isToday ? "bg-brand-50/60" : isWeekend ? "bg-slate-50/60" : ""}`}
                        />
                      );
                    })}

                    {/* Booking blocks — absolutely positioned */}
                    {vBookings.map((b) => {
                      const startStr = b.start_at.slice(0, 10);
                      const endStr   = b.end_at.slice(0, 10);
                      const monthStart = toDateStr(year, month, 1);
                      const monthEnd   = toDateStr(year, month, days);

                      // Clip to current month view
                      const visStart = startStr < monthStart ? monthStart : startStr;
                      const visEnd   = endStr   > monthEnd   ? monthEnd   : endStr;

                      const [sy, sm, sd] = visStart.split("-").map(Number);
                      const [ey, em, ed] = visEnd.split("-").map(Number);

                      // Days from month start (0-indexed)
                      const startDay = new Date(sy, sm - 1, sd).getDate() - 1;
                      // End is exclusive (return date = car back, so block ends that day)
                      const endDay   = new Date(ey, em - 1, ed).getDate() - 1;
                      const span     = Math.max(1, endDay - startDay);

                      // Don't render if booking is entirely outside this month
                      if (startStr > monthEnd || endStr <= monthStart) return null;

                      const colorBg   = STATUS_COLOR[b.status] ?? "bg-neutral-200";
                      const colorText = STATUS_TEXT[b.status]  ?? "text-neutral-700";
                      const startsInView = startStr >= monthStart;
                      const endsInView   = endStr   <= monthEnd;

                      return (
                        <Link
                          key={b.id}
                          href={`/app/rentals/${companyId}/${b.id}`}
                          title={`${b.customer_name} — ${b.status}`}
                          style={{
                            left:  startDay * DAY_W + 2,
                            width: span * DAY_W - 4,
                            top: "50%", transform: "translateY(-50%)",
                          }}
                          className={`absolute flex h-8 items-center overflow-hidden px-2 text-xs font-medium transition-opacity hover:opacity-90
                            ${colorBg} ${colorText}
                            ${startsInView ? "rounded-l-md" : ""}
                            ${endsInView   ? "rounded-r-md" : ""}
                          `}
                        >
                          <span className="truncate">{b.customer_name}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 border-t border-border px-4 py-3">
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
            <span className="h-3 w-3 rounded-sm bg-brand-100 ring-1 ring-brand-400" />
            <span className="text-xs text-neutral-500">Today</span>
          </div>
        </div>
      </div>

      {vehicles.length === 0 && (
        <div className="mt-4 text-center text-sm text-neutral-400">
          No vehicles in your fleet yet.{" "}
          <Link href={`/app/fleet/${companyId}/add`} className="text-brand-700 hover:underline">Add one →</Link>
        </div>
      )}
    </div>
  );
}
