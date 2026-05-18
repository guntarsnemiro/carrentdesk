"use client";

interface MonthBar {
  label: string;   // "Jan", "Feb", etc.
  revenue: number;
  bookings: number;
  isCurrent: boolean;
}

export function RevenueChart({ months }: { months: MonthBar[] }) {
  const max = Math.max(...months.map((m) => m.revenue), 1);

  function fmt(n: number) {
    if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
    return `€${n.toFixed(0)}`;
  }

  return (
    <div>
      <div className="flex h-40 items-end gap-2">
        {months.map((m) => {
          const pct = (m.revenue / max) * 100;
          return (
            <div key={m.label} className="group relative flex flex-1 flex-col items-center">
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg border border-border bg-white px-3 py-2 text-center shadow-lg group-hover:block">
                <p className="text-sm font-semibold text-neutral-900">{fmt(m.revenue)}</p>
                <p className="text-xs text-neutral-400">{m.bookings} {m.bookings === 1 ? "booking" : "bookings"}</p>
              </div>
              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  style={{ height: `${Math.max(pct, m.revenue > 0 ? 4 : 0)}%` }}
                  className={`w-full rounded-t-md transition-all duration-300
                    ${m.isCurrent
                      ? "bg-brand-600"
                      : m.revenue > 0
                        ? "bg-brand-200 group-hover:bg-brand-300"
                        : "bg-slate-100"
                    }`}
                />
              </div>
              {/* Label */}
              <p className={`mt-1.5 text-xs font-medium ${m.isCurrent ? "text-brand-700" : "text-neutral-400"}`}>
                {m.label}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-right text-xs text-neutral-400">Hover bars for details · based on booking price</p>
    </div>
  );
}
