"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RangeCalendar } from "@/components/booking/range-calendar";
import {
  addDaysYmd,
  BOOKING_TIME_SLOTS,
  bookedDurationFromFields,
  isValidDateTimeRange,
  todayYmd,
} from "@/lib/booking/dates";

function ymdToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type Props = {
  pickup: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  onPickupChange: (ymd: string) => void;
  onReturnChange: (ymd: string) => void;
  onPickupTimeChange: (time: string) => void;
  onReturnTimeChange: (time: string) => void;
  minDate?: string;
};

export function DateTimeRangeFields({
  pickup,
  returnDate,
  pickupTime,
  returnTime,
  onPickupChange,
  onReturnChange,
  onPickupTimeChange,
  onReturnTimeChange,
  minDate,
}: Props) {
  const min = minDate ?? todayYmd();
  const [open, setOpen] = useState<"pickup" | "return" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const placePanel = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const width = Math.min(window.innerWidth - 24, 672);
    let left = rect.left;
    if (left + width > window.innerWidth - 12) left = Math.max(12, window.innerWidth - width - 12);
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    placePanel();
    window.addEventListener("scroll", placePanel, { passive: true });
    window.addEventListener("resize", placePanel, { passive: true });
    return () => {
      window.removeEventListener("scroll", placePanel);
      window.removeEventListener("resize", placePanel);
    };
  }, [open, placePanel]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function selectDate(day: string) {
    if (open === "pickup" || day < pickup) {
      onPickupChange(day);
      if (!isValidDateTimeRange(day, pickupTime, returnDate, returnTime)) {
        onReturnChange(addDaysYmd(day, 3));
      }
      setOpen("return");
      return;
    }
    onReturnChange(day);
    setOpen(null);
  }

  const duration = bookedDurationFromFields(pickup, pickupTime, returnDate, returnTime);

  const calendar = mounted && open
    ? createPortal(
        <div ref={panelRef} style={panelStyle}>
          <RangeCalendar
            key={open}
            pickup={pickup}
            returnDate={returnDate}
            pickupTime={pickupTime}
            returnTime={returnTime}
            selecting={open}
            onSelectDate={selectDate}
            minDate={min}
          />
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={wrapRef} className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-stretch sm:gap-0">
      <DateTimeField
        label="Pickup"
        date={pickup}
        time={pickupTime}
        open={open === "pickup"}
        onOpen={() => setOpen("pickup")}
        onTimeChange={onPickupTimeChange}
      />
      <span aria-hidden className="hidden self-stretch bg-border sm:my-1 sm:block sm:w-px" />
      <DateTimeField
        label="Return"
        date={returnDate}
        time={returnTime}
        open={open === "return"}
        onOpen={() => setOpen("return")}
        onTimeChange={onReturnTimeChange}
      />
      {duration.billedDays > 0 && (
        <p className="px-3 py-2 text-xs font-medium text-brand-800 sm:hidden">{duration.label}</p>
      )}
      {calendar}
    </div>
  );
}

function DateTimeField({
  label,
  date,
  time,
  open,
  onOpen,
  onTimeChange,
}: {
  label: string;
  date: string;
  time: string;
  open: boolean;
  onOpen: () => void;
  onTimeChange: (time: string) => void;
}) {
  return (
    <div className={`shrink-0 rounded-xl px-3 py-2 transition-colors hover:bg-surface-soft ${open ? "bg-surface-soft" : ""}`}>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <div className="mt-0.5 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 whitespace-nowrap text-sm font-medium leading-5 tabular-nums text-brand-950"
        >
          <span>{ymdToDisplay(date) || "DD/MM/YYYY"}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-neutral-400" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
        <label className="relative flex items-center">
          <span className="sr-only">{label} time</span>
          <select
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="h-5 appearance-none bg-transparent pr-4 text-sm font-medium leading-5 tabular-nums text-brand-950 outline-none"
          >
            {BOOKING_TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-0 text-neutral-400" aria-hidden>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </label>
      </div>
    </div>
  );
}
