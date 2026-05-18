"use client";

import { useRef, useEffect } from "react";
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

const DAY_W        = 44;   // px per day column
const DAYS_PAST    = 60;   // days to the left of today
const DAYS_FUTURE  = 90;   // days to the right of today
const TOTAL_DAYS   = DAYS_PAST + 1 + DAYS_FUTURE;
const SCROLL_OFFSET = 7;   // show 1 week before today on load

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function toStr(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function CalendarGrid({ companyId, vehicles, bookings }: Props) {
  const scrollRef   = useRef<HTMLDivElement>(null);
  const today       = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr    = toStr(today);

  // Build the full day array
  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = addDays(today, i - DAYS_PAST);
    return { date: d, str: toStr(d) };
  });

  // Scroll to today − SCROLL_OFFSET on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const targetDay = DAYS_PAST - SCROLL_OFFSET;
    scrollRef.current.scrollLeft = targetDay * DAY_W;
  }, []);

  function scrollToToday() {
    if (!scrollRef.current) return;
    const targetDay = DAYS_PAST - SCROLL_OFFSET;
    scrollRef.current.scrollTo({ left: targetDay * DAY_W, behavior: "smooth" });
  }

  const totalWidth = TOTAL_DAYS * DAY_W;

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -7 * DAY_W, behavior: "smooth" })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-slate-50"
        >
          ← 1 week
        </button>
        <button
          onClick={scrollToToday}
          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          Today
        </button>
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 7 * DAY_W, behavior: "smooth" })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-slate-50"
        >
          1 week →
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex">

          {/* Fixed vehicle column */}
          <div className="shrink-0 border-r border-border" style={{ minWidth: 180 }}>
            {/* Month/day header spacer */}
            <div className="h-14 border-b border-border" />
            {vehicles.map((v, i) => (
              <div
                key={v.id}
                className={`flex h-14 flex-col justify-center px-4 ${i < vehicles.length - 1 ? "border-b border-border" : ""}`}
              >
                <p className="text-sm font-medium text-neutral-900 leading-tight">{v.make} {v.model}</p>
                <p className="font-mono text-xs text-neutral-400">{v.plate}</p>
              </div>
            ))}
          </div>

          {/* Scrollable timeline */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-scroll"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
          >
            <div style={{ width: totalWidth }}>

              {/* Header: two rows — month labels + day numbers */}
              <div className="sticky top-0 z-10 border-b border-border bg-white" style={{ height: 56 }}>
                {/* Month labels row */}
                <div className="flex" style={{ height: 24 }}>
                  {days.map(({ date, str }) => {
                    const isFirst = date.getDate() === 1;
                    const isToday = str === todayStr;
                    return (
                      <div
                        key={str}
                        style={{ width: DAY_W }}
                        className={`shrink-0 border-r border-border/30 ${isToday ? "bg-brand-50" : ""}`}
                      >
                        {isFirst && (
                          <span className="block truncate pl-1.5 pt-1 text-[11px] font-semibold text-neutral-500">
                            {MONTH_SHORT[date.getMonth()]} {date.getFullYear()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Day numbers row */}
                <div className="flex" style={{ height: 32 }}>
                  {days.map(({ date, str }) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday   = str === todayStr;
                    return (
                      <div
                        key={str}
                        style={{ width: DAY_W }}
                        className={`flex shrink-0 flex-col items-center justify-center border-r border-border/30
                          ${isToday ? "bg-brand-500" : isWeekend ? "bg-slate-50" : ""}`}
                      >
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
                  <div
                    key={v.id}
                    className={`relative flex h-14 ${vi < vehicles.length - 1 ? "border-b border-border" : ""}`}
                  >
                    {/* Background cells */}
                    {days.map(({ date, str }) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday   = str === todayStr;
                      return (
                        <div
                          key={str}
                          style={{ width: DAY_W }}
                          className={`shrink-0 h-full border-r border-border/30
                            ${isToday ? "bg-brand-50/50" : isWeekend ? "bg-slate-50/70" : ""}`}
                        />
                      );
                    })}

                    {/* Booking blocks */}
                    {vBookings.map((b) => {
                      const startStr = b.start_at.slice(0, 10);
                      const endStr   = b.end_at.slice(0, 10);

                      // Clip to visible range
                      const visStart = startStr < rangeStart ? rangeStart : startStr;
                      const visEnd   = endStr   > rangeEnd   ? rangeEnd   : endStr;

                      // Don't render if outside the range
                      if (startStr > rangeEnd || endStr <= rangeStart) return null;

                      // Find column indices
                      const startIdx = days.findIndex((d) => d.str === visStart);
                      const endIdx   = days.findIndex((d) => d.str === visEnd);
                      if (startIdx === -1) return null;

                      const span = endIdx === -1
                        ? days.length - startIdx
                        : Math.max(1, endIdx - startIdx);

                      const colorBg   = STATUS_COLOR[b.status] ?? "bg-neutral-200";
                      const colorText = STATUS_TEXT[b.status]  ?? "text-neutral-700";
                      const clipsLeft  = startStr < rangeStart;
                      const clipsRight = endStr   > rangeEnd;

                      return (
                        <Link
                          key={b.id}
                          href={`/app/rentals/${companyId}/${b.id}`}
                          title={`${b.customer_name} · ${b.start_at.slice(0,10)} → ${b.end_at.slice(0,10)}`}
                          style={{
                            left:  startIdx * DAY_W + 2,
                            width: span    * DAY_W - 4,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          className={`absolute flex h-8 items-center overflow-hidden px-2 text-xs font-medium transition-opacity hover:opacity-85
                            ${colorBg} ${colorText}
                            ${!clipsLeft  ? "rounded-l-md" : ""}
                            ${!clipsRight ? "rounded-r-md" : ""}
                          `}
                        >
                          <span className="truncate">{b.customer_name}</span>
                        </Link>
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
            { label: "Confirmed", color: "bg-amber-400"   },
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
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-slate-100 ring-1 ring-slate-200" />
            <span className="text-xs text-neutral-500">Weekend</span>
          </div>
        </div>
      </div>
    </div>
  );
}
