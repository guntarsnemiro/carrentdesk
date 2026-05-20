import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { RevenueChart } from "./_components/revenue-chart";

export const metadata: Metadata = { title: "Finance" };

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
}

function pct(current: number, prev: number) {
  if (prev === 0) return current > 0 ? "+100%" : "—";
  const d = ((current - prev) / prev) * 100;
  return (d >= 0 ? "+" : "") + d.toFixed(1) + "%";
}

function pctColor(current: number, prev: number) {
  if (prev === 0) return current > 0 ? "text-emerald-600" : "text-neutral-400";
  return current >= prev ? "text-emerald-600" : "text-red-500";
}

export default async function FinancePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();

  const { data: membership } = await db
    .from("company_members").select("role")
    .eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
  if (!membership) notFound();

  const { data: company } = await db
    .from("companies").select("id, name")
    .eq("id", companyId).maybeSingle();
  if (!company) notFound();

  // Fetch all non-cancelled bookings with price > 0
  const { data: bookings } = await db
    .from("bookings")
    .select("id, start_at, end_at, booking_price, status, vehicle_id, vehicles(make, model, plate)")
    .eq("company_id", companyId)
    .neq("status", "cancelled")
    .order("start_at", { ascending: false });

  // Fetch maintenance costs
  const { data: maintLogs } = await db
    .from("maintenance_logs")
    .select("id, date, cost, vehicle_id, type")
    .eq("company_id", companyId);

  const all = (bookings ?? []) as {
    id: string;
    start_at: string;
    end_at: string;
    booking_price: number | null;
    status: string;
    vehicle_id: string;
    vehicles: { make: string; model: string; plate: string } | null;
  }[];

  const now        = new Date();
  const thisYear   = now.getFullYear();
  const thisMonth  = now.getMonth();

  function inMonth(iso: string, year: number, month: number) {
    const d = new Date(iso);
    return d.getFullYear() === year && d.getMonth() === month;
  }

  const lastMonthYear  = thisMonth === 0 ? thisYear - 1 : thisYear;
  const lastMonthIndex = thisMonth === 0 ? 11 : thisMonth - 1;

  const priceOf = (b: typeof all[0]) => b.booking_price ?? 0;

  const thisMonthBookings  = all.filter((b) => inMonth(b.start_at, thisYear, thisMonth));
  const lastMonthBookings  = all.filter((b) => inMonth(b.start_at, lastMonthYear, lastMonthIndex));
  const thisYearBookings   = all.filter((b) => new Date(b.start_at).getFullYear() === thisYear);

  const revenueThisMonth  = thisMonthBookings.reduce((s, b) => s + priceOf(b), 0);
  const revenueLastMonth  = lastMonthBookings.reduce((s, b) => s + priceOf(b), 0);
  const revenueThisYear   = thisYearBookings.reduce((s, b) => s + priceOf(b), 0);
  const avgBookingValue   = all.length ? all.reduce((s, b) => s + priceOf(b), 0) / all.length : 0;

  // Maintenance costs
  const maint = (maintLogs ?? []) as { id: string; date: string; cost: number; vehicle_id: string; type: string }[];
  const costOf = (m: typeof maint[0]) => Number(m.cost);
  const maintThisMonth = maint.filter((m) => inMonth(m.date, thisYear, thisMonth));
  const maintThisYear  = maint.filter((m) => new Date(m.date).getFullYear() === thisYear);
  const costsThisMonth = maintThisMonth.reduce((s, m) => s + costOf(m), 0);
  const costsThisYear  = maintThisYear.reduce((s, m) => s + costOf(m), 0);
  const profitThisMonth = revenueThisMonth - costsThisMonth;
  const profitThisYear  = revenueThisYear  - costsThisYear;

  // Last 12 months bars
  const chartMonths = Array.from({ length: 12 }, (_, i) => {
    const offset = 11 - i;
    const mIdx   = ((thisMonth - offset) % 12 + 12) % 12;
    const mYear  = thisYear - Math.floor((offset - thisMonth + 12) / 12 + (thisMonth >= offset ? 0 : 1));
    // Recalculate correctly
    const date = new Date(thisYear, thisMonth - offset, 1);
    const yr   = date.getFullYear();
    const mo   = date.getMonth();
    const mBookings = all.filter((b) => inMonth(b.start_at, yr, mo));
    const mMaint    = maint.filter((m) => inMonth(m.date, yr, mo));
    return {
      label:     MONTH_SHORT[mo]!,
      revenue:   mBookings.reduce((s, b) => s + priceOf(b), 0),
      costs:     mMaint.reduce((s, m) => s + costOf(m), 0),
      bookings:  mBookings.length,
      isCurrent: mo === thisMonth && yr === thisYear,
    };
  });

  // Revenue by vehicle
  type VehicleStat = {
    id: string; make: string; model: string; plate: string;
    bookings: number; revenue: number; avgDays: number;
  };
  const vehicleMap = new Map<string, VehicleStat>();
  for (const b of all) {
    if (!b.vehicles) continue;
    const key = b.vehicle_id;
    if (!vehicleMap.has(key)) {
      vehicleMap.set(key, {
        id: key,
        make: b.vehicles.make,
        model: b.vehicles.model,
        plate: b.vehicles.plate,
        bookings: 0,
        revenue: 0,
        avgDays: 0,
      });
    }
    const stat = vehicleMap.get(key)!;
    stat.bookings += 1;
    stat.revenue  += priceOf(b);
    const days = Math.max(1, Math.ceil(
      (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / (1000 * 60 * 60 * 24)
    ));
    stat.avgDays += days;
  }
  const vehicleStats = Array.from(vehicleMap.values())
    .map((v) => ({ ...v, avgDays: v.bookings ? v.avgDays / v.bookings : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  // Recent bookings (last 10 with a price)
  const recentWithPrice = all.filter((b) => (b.booking_price ?? 0) > 0).slice(0, 10);

  // Cost breakdown by maintenance type
  const TYPE_LABELS: Record<string, string> = {
    oil_change:         "Oil change",
    tires:              "Tires",
    brakes:             "Brakes",
    gov_inspection_fee: "Gov. inspection fee",
    insurance_payment:  "Insurance payment",
    bodywork:           "Bodywork / paint",
    cleaning:           "Cleaning / detailing",
    other:              "Other",
  };
  const costByType = new Map<string, number>();
  for (const m of maint) {
    costByType.set(m.type, (costByType.get(m.type) ?? 0) + costOf(m));
  }
  const costBreakdown = Array.from(costByType.entries())
    .map(([type, total]) => ({ type, label: TYPE_LABELS[type] ?? type, total }))
    .sort((a, b) => b.total - a.total);
  const totalCostAll = maint.reduce((s, m) => s + costOf(m), 0);

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Finance</h1>
        <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
      </div>

      {/* ── Top stats ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Revenue this month"
          value={fmt(revenueThisMonth)}
          sub={`${thisMonthBookings.length} bookings`}
          badge={pct(revenueThisMonth, revenueLastMonth)}
          badgeColor={pctColor(revenueThisMonth, revenueLastMonth)}
          footnote="vs last month"
        />
        <StatCard
          label="Costs this month"
          value={fmt(costsThisMonth)}
          sub={`${maintThisMonth.length} entries`}
        />
        <StatCard
          label="Profit this month"
          value={fmt(profitThisMonth)}
          sub={profitThisMonth >= 0 ? "positive" : "negative"}
          badgeColor={profitThisMonth >= 0 ? "text-emerald-600" : "text-red-500"}
        />
        <StatCard
          label="Avg booking value"
          value={fmt(avgBookingValue)}
          sub={`across ${all.length} total`}
        />
      </div>

      {/* ── Year stats ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Revenue this year" value={fmt(revenueThisYear)} sub={`${thisYearBookings.length} bookings`} />
        <StatCard label="Costs this year"   value={fmt(costsThisYear)}   sub={`${maintThisYear.length} entries`} />
        <StatCard
          label="Profit this year"
          value={fmt(profitThisYear)}
          sub={profitThisYear >= 0 ? "positive" : "negative"}
          badgeColor={profitThisYear >= 0 ? "text-emerald-600" : "text-red-500"}
        />
      </div>

      {/* ── Revenue chart ── */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 text-base font-semibold text-neutral-900">Revenue — last 12 months</h2>
        <RevenueChart months={chartMonths} />
      </div>

      {/* ── Revenue by vehicle ── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Revenue by vehicle</h2>
        </div>
        {vehicleStats.length === 0 ? (
          <p className="px-6 py-8 text-sm text-neutral-400">No bookings with a price recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-6 py-3 font-medium text-neutral-500">Vehicle</th>
                <th className="px-6 py-3 font-medium text-neutral-500 text-right">Bookings</th>
                <th className="px-6 py-3 font-medium text-neutral-500 text-right">Avg days</th>
                <th className="px-6 py-3 font-medium text-neutral-500 text-right">Total revenue</th>
                <th className="px-6 py-3 font-medium text-neutral-500 text-right">Avg / booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicleStats.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link href={`/app/fleet/${companyId}/${v.id}`} className="hover:underline">
                      <span className="font-medium text-neutral-900">{v.make} {v.model}</span>
                      <span className="ml-2 font-mono text-xs text-neutral-400">{v.plate}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-right text-neutral-700">{v.bookings}</td>
                  <td className="px-6 py-3 text-right text-neutral-500">{v.avgDays.toFixed(1)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-neutral-900">{fmt(v.revenue)}</td>
                  <td className="px-6 py-3 text-right text-neutral-600">{fmt(v.revenue / v.bookings)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-slate-50">
                <td className="px-6 py-3 text-sm font-semibold text-neutral-700">Total</td>
                <td className="px-6 py-3 text-right text-sm font-semibold text-neutral-700">
                  {vehicleStats.reduce((s, v) => s + v.bookings, 0)}
                </td>
                <td />
                <td className="px-6 py-3 text-right text-sm font-bold text-neutral-900">
                  {fmt(vehicleStats.reduce((s, v) => s + v.revenue, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── Cost breakdown by type ── */}
      {costBreakdown.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900">Cost breakdown by category</h2>
            <p className="text-xs text-neutral-400 mt-0.5">All time · from maintenance log</p>
          </div>
          <div className="divide-y divide-border">
            {costBreakdown.map(({ type, label, total }) => {
              const barW = totalCostAll > 0 ? (total / totalCostAll) * 100 : 0;
              return (
                <div key={type} className="flex items-center gap-4 px-6 py-3">
                  <span className="w-40 shrink-0 text-sm text-neutral-700">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-red-300" style={{ width: `${barW}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-sm font-semibold text-neutral-900">{fmt(total)}</span>
                  <span className="w-10 shrink-0 text-right text-xs text-neutral-400">{barW.toFixed(0)}%</span>
                </div>
              );
            })}
            <div className="flex items-center gap-4 px-6 py-3 bg-slate-50">
              <span className="w-40 shrink-0 text-sm font-semibold text-neutral-700">Total</span>
              <div className="flex-1" />
              <span className="w-20 shrink-0 text-right text-sm font-bold text-neutral-900">{fmt(totalCostAll)}</span>
              <span className="w-10 shrink-0" />
            </div>
          </div>
        </div>
      )}

      {/* ── Recent bookings with value ── */}
      {recentWithPrice.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900">Recent bookings</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-6 py-3 font-medium text-neutral-500">Date</th>
                <th className="px-6 py-3 font-medium text-neutral-500">Vehicle</th>
                <th className="px-6 py-3 font-medium text-neutral-500">Days</th>
                <th className="px-6 py-3 font-medium text-neutral-500">Status</th>
                <th className="px-6 py-3 font-medium text-neutral-500 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentWithPrice.map((b) => {
                const days = Math.max(1, Math.ceil(
                  (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / (1000 * 60 * 60 * 24)
                ));
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-neutral-600">
                      {new Date(b.start_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-3">
                      {b.vehicles
                        ? <Link href={`/app/rentals/${companyId}/${b.id}`} className="font-medium text-neutral-900 hover:underline">
                            {b.vehicles.make} {b.vehicles.model}
                            <span className="ml-1.5 font-mono text-xs text-neutral-400">{b.vehicles.plate}</span>
                          </Link>
                        : "—"
                      }
                    </td>
                    <td className="px-6 py-3 text-neutral-500">{days}d</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-neutral-900">
                      {fmt(b.booking_price ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {all.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No bookings recorded yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Create your first booking to start tracking revenue.</p>
          <Link href={`/app/rentals/${companyId}/add`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            + New booking
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, badge, badgeColor, footnote }: {
  label: string; value: string; sub: string;
  badge?: string; badgeColor?: string; footnote?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-xs font-medium text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
      <p className="mt-1 text-xs text-neutral-400">{sub}</p>
      {badge && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`text-sm font-semibold ${badgeColor}`}>{badge}</span>
          {footnote && <span className="text-xs text-neutral-400">{footnote}</span>}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-amber-50 text-amber-700",
  active:    "bg-emerald-50 text-emerald-700",
  returned:  "bg-neutral-100 text-neutral-500",
  cancelled: "bg-red-50 text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? ""}`}>
      {status}
    </span>
  );
}
