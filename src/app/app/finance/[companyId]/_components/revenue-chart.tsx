"use client";

interface MonthBar {
  label: string;
  revenue: number;
  costs: number;
  bookings: number;
  isCurrent: boolean;
}

export function RevenueChart({ months }: { months: MonthBar[] }) {
  const max = Math.max(...months.map((m) => Math.max(m.revenue, m.costs)), 1);

  function fmt(n: number) {
    if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
    return `€${n.toFixed(0)}`;
  }

  return (
    <div>
      {/* Legend */}
      <div className="mb-3 flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-500 inline-block" />Revenue</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-300 inline-block" />Costs</span>
      </div>
      <div className="flex h-40 items-end gap-1.5">
        {months.map((m) => {
          const revPct  = (m.revenue / max) * 100;
          const costPct = (m.costs   / max) * 100;
          const profit  = m.revenue - m.costs;
          return (
            <div key={m.label} className="group relative flex flex-1 flex-col items-center">
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-2 hidden min-w-[120px] rounded-lg border border-border bg-white px-3 py-2 text-center shadow-lg group-hover:block z-10">
                <p className="text-sm font-semibold text-neutral-900">{fmt(m.revenue)}</p>
                <p className="text-xs text-red-500">−{fmt(m.costs)} costs</p>
                <p className={`text-xs font-medium ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {profit >= 0 ? "+" : ""}{fmt(profit)} profit
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">{m.bookings} {m.bookings === 1 ? "booking" : "bookings"}</p>
              </div>
              {/* Stacked bars */}
              <div className="w-full flex-1 flex items-end gap-0.5">
                {/* Revenue bar */}
                <div className="flex-1 flex items-end">
                  <div
                    style={{ height: `${Math.max(revPct, m.revenue > 0 ? 4 : 0)}%` }}
                    className={`w-full rounded-t-md transition-all duration-300
                      ${m.isCurrent
                        ? "bg-brand-600"
                        : m.revenue > 0
                          ? "bg-brand-200 group-hover:bg-brand-300"
                          : "bg-slate-100"
                      }`}
                  />
                </div>
                {/* Cost bar */}
                <div className="flex-1 flex items-end">
                  <div
                    style={{ height: `${Math.max(costPct, m.costs > 0 ? 4 : 0)}%` }}
                    className={`w-full rounded-t-md transition-all duration-300
                      ${m.costs > 0 ? "bg-red-200 group-hover:bg-red-300" : "bg-slate-100"}`}
                  />
                </div>
              </div>
              {/* Label */}
              <p className={`mt-1.5 text-xs font-medium ${m.isCurrent ? "text-brand-700" : "text-neutral-400"}`}>
                {m.label}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-right text-xs text-neutral-400">Hover bars for details</p>
    </div>
  );
}
