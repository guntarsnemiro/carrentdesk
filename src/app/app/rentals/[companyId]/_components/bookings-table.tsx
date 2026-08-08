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

function formatDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateRange(start: string, end: string) {
  return `${formatDay(start)} ${formatTime(start)} → ${formatDay(end)} ${formatTime(end)}`;
}

function formatPrice(n: number | null) {
  if (n == null) return "—";
  return `€${n.toFixed(0)}`;
}

function formatVehicle(v: BookingRow["vehicles"]) {
  if (!v) return "—";
  return `${v.plate} · ${v.make} ${v.model}`;
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
    <div>
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

      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-0 table-fixed text-xs">
          <colgroup>
            <col className="w-[3.25rem]" />
            <col />
            <col />
            <col className="w-[26%]" />
            <col className="w-[4.5rem]" />
            <col className="w-[5.5rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-slate-50 text-left">
              <th className="sticky left-0 z-10 bg-slate-50 px-2 py-2 font-medium text-neutral-500">
                Edit
              </th>
              <th className="px-2 py-2 font-medium text-neutral-500">Customer</th>
              <th className="px-2 py-2 font-medium text-neutral-500">Vehicle</th>
              <th className="px-2 py-2 font-medium text-neutral-500">Dates</th>
              <th className="px-2 py-2 font-medium text-neutral-500">Price</th>
              <th className="px-2 py-2 font-medium text-neutral-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
                  No bookings match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const customerTitle = [
                  b.customers?.full_name,
                  b.customers?.phone,
                ].filter(Boolean).join(" · ");
                const vehicleTitle = b.vehicles
                  ? `${b.vehicles.make} ${b.vehicles.model} (${b.vehicles.year}) · ${b.vehicles.plate}`
                  : undefined;
                const dateTitle = formatDateRange(b.start_at, b.end_at);

                return (
                  <tr key={b.id} className="group hover:bg-slate-50">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-2 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.12)] group-hover:bg-slate-50">
                      <Link
                        href={`/app/rentals/${companyId}/${b.id}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                    <td className="max-w-0 truncate px-2 py-2" title={customerTitle || undefined}>
                      <span className="font-medium text-neutral-900">
                        {b.customers?.full_name ?? "—"}
                      </span>
                      {b.customers?.blacklisted && (
                        <span className="ml-1 text-red-500" title="Blacklisted">⚠</span>
                      )}
                    </td>
                    <td className="max-w-0 truncate px-2 py-2 font-medium text-neutral-800" title={vehicleTitle}>
                      {formatVehicle(b.vehicles)}
                    </td>
                    <td
                      className="max-w-0 truncate px-2 py-2 tabular-nums text-neutral-600"
                      title={dateTitle}
                    >
                      {formatDateRange(b.start_at, b.end_at)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 tabular-nums text-neutral-700">
                      {formatPrice(b.booking_price)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      <span
                        className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${STATUS_STYLES[b.status] ?? "bg-neutral-100 text-neutral-500"}`}
                      >
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
