"use client";

import { useMemo, useState } from "react";
import {
  bookedDurationFromFields,
  MONTHS,
  todayYmd,
  ymd,
} from "@/lib/booking/dates";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

type Props = {
  pickup: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  selecting: "pickup" | "return";
  onSelectDate: (ymdStr: string) => void;
  minDate?: string;
};

function monthStart(anchor: string): { year: number; month: number } {
  const [year, month] = anchor.split("-").map(Number);
  return { year, month: month - 1 };
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function cellsForMonth(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < mondayOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(ymd(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function RangeCalendar({
  pickup,
  returnDate,
  pickupTime,
  returnTime,
  selecting,
  onSelectDate,
  minDate,
}: Props) {
  const min = minDate ?? todayYmd();
  const initial = monthStart(selecting === "return" && returnDate ? returnDate : pickup || min);
  const [view, setView] = useState(initial);
  const [hover, setHover] = useState<string | null>(null);

  const second = shiftMonth(view.year, view.month, 1);
  const rangeEndPreview =
    selecting === "return" && hover && hover >= pickup ? hover : returnDate;

  const duration = bookedDurationFromFields(
    pickup,
    pickupTime,
    rangeEndPreview || pickup,
    returnTime,
  );

  const months = useMemo(
    () => [
      { ...view, cells: cellsForMonth(view.year, view.month) },
      { ...second, cells: cellsForMonth(second.year, second.month) },
    ],
    [view, second.year, second.month],
  );

  function inRange(day: string): "start" | "end" | "middle" | "single" | null {
    if (!pickup) return null;
    const end = rangeEndPreview;
    if (!end) return day === pickup ? "start" : null;
    if (day === pickup && day === end) return "single";
    if (day === pickup) return "start";
    if (day === end) return "end";
    if (day > pickup && day < end) return "middle";
    return null;
  }

  return (
    <div className="w-[min(100vw-2rem,42rem)] rounded-2xl border border-border bg-white p-4 shadow-2xl sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setView((v) => shiftMonth(v.year, v.month, -1))}
          className="grid size-10 place-items-center rounded-xl text-brand-900 hover:bg-surface-soft"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-brand-950">
          {selecting === "pickup" ? "Choose pickup date" : "Choose return date"}
        </p>
        <button
          type="button"
          onClick={() => setView((v) => shiftMonth(v.year, v.month, 1))}
          className="grid size-10 place-items-center rounded-xl text-brand-900 hover:bg-surface-soft"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {months.map((m) => (
          <div key={`${m.year}-${m.month}`}>
            <p className="mb-3 text-center text-base font-semibold text-brand-950">
              {MONTHS[m.month]} {m.year}
            </p>
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-1">{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-y-1">
              {m.cells.map((day, i) => {
                if (!day) return <span key={`e-${i}`} />;
                const disabled = day < min;
                const role = inRange(day);
                const classes = [
                  "relative mx-auto flex h-11 w-11 items-center justify-center text-sm font-medium transition-colors",
                  disabled ? "cursor-not-allowed text-neutral-300" : "cursor-pointer hover:bg-brand-50",
                  role === "single" || role === "start" || role === "end"
                    ? "rounded-full bg-brand-900 text-white hover:bg-brand-800"
                    : role === "middle"
                      ? "rounded-md bg-brand-100 text-brand-950"
                      : "rounded-full text-brand-950",
                ].join(" ");
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    className={classes}
                    onMouseEnter={() => setHover(day)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onSelectDate(day)}
                  >
                    {Number(day.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-950">
        <span>
          {pickup ? `${pickup.slice(8)} ${MONTHS[Number(pickup.slice(5, 7)) - 1]}, ${pickupTime}` : "Pickup"}
          {" → "}
          {rangeEndPreview
            ? `${rangeEndPreview.slice(8)} ${MONTHS[Number(rangeEndPreview.slice(5, 7)) - 1]}, ${returnTime}`
            : "Return"}
        </span>
        <span className="font-semibold">{duration.label}</span>
      </div>
    </div>
  );
}
