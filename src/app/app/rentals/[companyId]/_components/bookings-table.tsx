"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type BookingRow = {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  booking_price: number | null;
  deposit_paid: boolean;
  vehicles: { make: string; model: string; year: number; plate: string } | null;
  customers: { full_name: string; phone: string; blacklisted: boolean } | null;
};

type StatusFilter = "all" | "confirmed" | "active" | "returned" | "cancelled";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-amber-50 text-amber-700",
  active:    "bg-emerald-50 text-emerald-700",
  returned:  "bg-neutral-100 text-neutral-500",
  cancelled: "bg-red-50 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  active:    "Active",
  returned:  "Returned",
  cancelled: "Cancelled",
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "active",    label: "Active" },
  { value: "returned",  label: "Returned" },
  { value: "cancelled", label: "Cancelled" },
];

/** Shared grid: fixed action + price, flexible text cols that can shrink/truncate. */
const ROW_GRID =
  "grid grid-cols-[1.75rem_minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,1.05fr)_2.75rem_minmax(0,3.5rem)] items-center gap-x-1.5 px-2";

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Short label for the row; full range + times go in title. */
function formatDateRangeShort(start: string, end: string) {
  const s = formatDay(start);
  const e = formatDay(end);
  return s === e ? s : `${s}→${e}`;
}

function formatDateRangeFull(start: string, end: string) {
  return `${formatDay(start)} ${formatTime(start)} → ${formatDay(end)} ${formatTime(end)}`;
}

function formatPrice(n: number | null) {
  if (n == null) return "—";
  return `€${n.toFixed(0)}`;
}

function formatVehicleShort(v: BookingRow["vehicles"]) {
  if (!v) return "—";
  return v.plate || `${v.make} ${v.model}`;
}

function formatVehicleFull(v: BookingRow["vehicles"]) {
  if (!v) return undefined;
  return `${v.make} ${v.model} (${v.year}) · ${v.plate}`;
}

function EditLink({ companyId, bookingId }: { companyId: string; bookingId: string }) {
  return (
    <Link
      href={`/app/rentals/${companyId}/${bookingId}`}
      aria-label="Edit booking"
      className="inline-flex h-6 w-6 items-center justify-center rounded text-brand-700 hover:bg-brand-50"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </Link>
  );
}

export function BookingsTable({
  bookings,
  companyId,
}: {
  bookings: BookingRow[];
  companyId: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const counts = useMemo(() => {
    const tally: Record<StatusFilter, number> = {
      all: bookings.length,
      confirmed: 0,
      active: 0,
      returned: 0,
      cancelled: 0,
    };
    for (const b of bookings) {
      if (b.status === "confirmed") tally.confirmed += 1;
      else if (b.status === "active") tally.active += 1;
      else if (b.status === "returned") tally.returned += 1;
      else if (b.status === "cancelled") tally.cancelled += 1;
    }
    return tally;
  }, [bookings]);

  const filtered = useMemo(() => {
    const list =
      statusFilter === "all"
        ? bookings
        : bookings.filter((b) => b.status === statusFilter);
    return [...list].sort(
      (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
    );
  }, [bookings, statusFilter]);

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-brand-700 text-white"
                : "bg-white text-neutral-600 ring-1 ring-border hover:bg-slate-50"
            }`}
          >
            {f.label}
            <span className={`ml-1 tabular-nums ${statusFilter === f.value ? "text-brand-100" : "text-neutral-400"}`}>
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className={`${ROW_GRID} border-b border-border bg-slate-50 py-2 text-[11px] font-medium text-neutral-500`}>
          <span aria-hidden />
          <span>Customer</span>
          <span>Vehicle</span>
          <span>Dates</span>
          <span>Price</span>
          <span>Status</span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-400">
            No bookings match this filter.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((b) => {
              const customerTitle = [
                b.customers?.full_name,
                b.customers?.phone,
              ].filter(Boolean).join(" · ");
              const vehicleTitle = formatVehicleFull(b.vehicles);
              const dateTitle = formatDateRangeFull(b.start_at, b.end_at);

              return (
                <div
                  key={b.id}
                  className={`${ROW_GRID} min-w-0 py-1.5 text-xs hover:bg-slate-50`}
                >
                  <EditLink companyId={companyId} bookingId={b.id} />

                  <span
                    className="min-w-0 truncate font-medium text-neutral-900"
                    title={customerTitle || undefined}
                  >
                    {b.customers?.full_name ?? "—"}
                    {b.customers?.blacklisted && (
                      <span className="ml-0.5 text-red-500" title="Blacklisted">⚠</span>
                    )}
                  </span>

                  <span
                    className="min-w-0 truncate font-medium text-neutral-800"
                    title={vehicleTitle}
                  >
                    {formatVehicleShort(b.vehicles)}
                  </span>

                  <span
                    className="min-w-0 truncate tabular-nums text-neutral-600"
                    title={dateTitle}
                  >
                    {formatDateRangeShort(b.start_at, b.end_at)}
                  </span>

                  <span className="truncate tabular-nums text-neutral-700">
                    {formatPrice(b.booking_price)}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={`block truncate rounded-full px-1 py-0.5 text-center text-[10px] font-medium leading-tight ${STATUS_STYLES[b.status] ?? "bg-neutral-100 text-neutral-500"}`}
                      title={STATUS_LABELS[b.status] ?? b.status}
                    >
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
