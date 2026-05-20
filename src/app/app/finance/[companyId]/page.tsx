import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { RevenueChart } from "./_components/revenue-chart";
import {
  buildPLRows, depositsHeld, deferredRevenue, monthProRataRevenue,
  monthAmortizedCosts, fleetMonthlyDepreciation, monthlyDepreciation,
  amortizedCost,
  type Booking, type PeriodCost, type VehicleAsset,
} from "@/lib/finance";

export const metadata: Metadata = { title: "Finance" };

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
}
function pct(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? "+100%" : "—";
  const d = ((curr - prev) / prev) * 100;
  return (d >= 0 ? "+" : "") + d.toFixed(1) + "%";
}
function pctColor(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? "text-emerald-600" : "text-neutral-400";
  return curr >= prev ? "text-emerald-600" : "text-red-500";
}

function StatCard({ label, value, sub, badge, badgeColor, footnote }: {
  label: string; value: string; sub?: string; badge?: string; badgeColor?: string; footnote?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white px-5 py-4">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
      {badge && <p className={`mt-1 text-xs font-medium ${badgeColor}`}>{badge} {footnote}</p>}
    </div>
  );
}

export default async function FinancePage({ params }: { params: Promise<{ companyId: string }> }) {
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
    .from("companies").select("id, name, default_depreciation_rate")
    .eq("id", companyId).maybeSingle();
  if (!company) notFound();

  const companyRate = company.default_depreciation_rate ?? 20;

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const [
    { data: bookingsRaw },
    { data: maintRaw },
    { data: bizRaw },
    { data: vehiclesRaw },
  ] = await Promise.all([
    db.from("bookings")
      .select("id, start_at, end_at, booking_price, paid_at, deposit_amount, deposit_returned_at, status, vehicle_id, vehicles(make, model, plate)")
      .eq("company_id", companyId)
      .neq("status", "cancelled"),
    db.from("maintenance_logs")
      .select("id, date, cost, covers_from, covers_until, vehicle_id, type")
      .eq("company_id", companyId),
    db.from("company_expenses")
      .select("id, date, amount, covers_from, covers_until, category")
      .eq("company_id", companyId),
    db.from("vehicles")
      .select("id, make, model, plate, purchase_price, purchase_date, depreciation_rate, residual_value, depreciation_mode, disposed_at, disposal_price")
      .eq("company_id", companyId),
  ]);

  const bookings = (bookingsRaw ?? []) as unknown as (Booking & { vehicles: { make: string; model: string; plate: string } | null })[];
  const costs: PeriodCost[] = [
    ...(maintRaw ?? []).map((m) => ({ id: m.id, date: m.date, amount: 0, cost: Number(m.cost), covers_from: m.covers_from, covers_until: m.covers_until, vehicle_id: m.vehicle_id })),
    ...(bizRaw   ?? []).map((e) => ({ id: e.id, date: e.date, amount: Number(e.amount),        covers_from: e.covers_from, covers_until: e.covers_until })),
  ];
  const vehicles = (vehiclesRaw ?? []) as VehicleAsset[];
  const maintCosts: PeriodCost[] = (maintRaw ?? []).map((m) => ({ id: m.id, date: m.date, amount: 0, cost: Number(m.cost), covers_from: m.covers_from, covers_until: m.covers_until, vehicle_id: m.vehicle_id }));
  const bizCosts:  PeriodCost[] = (bizRaw   ?? []).map((e) => ({ id: e.id, date: e.date, amount: Number(e.amount), covers_from: e.covers_from, covers_until: e.covers_until }));

  // ── P&L rows (12 months) ────────────────────────────────────────────────────
  const plRows = buildPLRows(bookings, costs, vehicles, companyRate, 12);
  const currentRow  = plRows[plRows.length - 1];
  const prevRow     = plRows[plRows.length - 2];

  // ── Cash position (as of today) ─────────────────────────────────────────────
  const now     = new Date();
  const deferred = deferredRevenue(bookings, now);
  const deposits = depositsHeld(bookings);
  const cashThisMonth = bookings.reduce((s, b) => {
    if (!b.paid_at || !b.booking_price) return s;
    const d = new Date(b.paid_at);
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
      ? s + b.booking_price : s;
  }, 0);

  // ── Chart data (12 months, pro-rata) ────────────────────────────────────────
  const chartData = plRows.map((r) => ({
    label:     r.label,
    revenue:   Math.round(r.revenue),
    costs:     Math.round(r.cashCosts + r.depreciation),
    bookings:  bookings.filter((b) => {
      const d = new Date(b.start_at);
      return d.getUTCFullYear() === r.year && d.getUTCMonth() === r.month;
    }).length,
    isCurrent: r.month === now.getUTCMonth() && r.year === now.getUTCFullYear(),
  }));

  // ── Fleet profitability (per vehicle, last 12 months) ───────────────────────
  type VehicleStat = {
    id: string; make: string; model: string; plate: string;
    revenue: number; directCosts: number; depreciation: number; netContrib: number;
    bookingCount: number; depMode: string | null;
  };
  const vehicleStatMap = new Map<string, VehicleStat>();
  for (const v of vehicles) {
    vehicleStatMap.set(v.id, {
      id: v.id, make: "", model: "", plate: "",
      revenue: 0, directCosts: 0, depreciation: 0, netContrib: 0,
      bookingCount: 0, depMode: v.depreciation_mode,
    });
  }
  for (const b of bookings) {
    if (!vehicleStatMap.has(b.vehicle_id)) continue;
    const s = vehicleStatMap.get(b.vehicle_id)!;
    if (!s.make && b.vehicles) { s.make = b.vehicles.make; s.model = b.vehicles.model; s.plate = b.vehicles.plate; }
    for (const r of plRows) {
      s.revenue += (() => {
        // Only count if booking falls in this 12-month window
        const start = new Date(b.start_at);
        return start.getUTCFullYear() >= plRows[0].year ? (function() {
          const { proRataRevenue } = require("@/lib/finance");
          return proRataRevenue(b, r.year, r.month);
        })() : 0;
      })();
    }
    s.bookingCount += 1;
  }

  // Simpler: compute per-vehicle revenue as all-time bookings pro-rata for 12 months
  const vStatsFinal: VehicleStat[] = [];
  for (const v of vehicles) {
    const vBookings = bookings.filter((b) => b.vehicle_id === v.id);
    const vMaint    = maintCosts.filter((c) => c.vehicle_id === v.id);
    let revenue = 0;
    let directCosts = 0;
    let depreciation = 0;
    for (const r of plRows) {
      revenue      += vBookings.reduce((s, b) => {
        const { proRataRevenue: prr } = require("@/lib/finance");
        return s + prr(b, r.year, r.month);
      }, 0);
      directCosts  += monthAmortizedCosts(vMaint, r.year, r.month);
      depreciation += monthlyDepreciation(v, companyRate, r.year, r.month);
    }
    const veh = bookings.find((b) => b.vehicle_id === v.id)?.vehicles;
    vStatsFinal.push({
      id: v.id,
      make: veh?.make ?? "", model: veh?.model ?? "", plate: veh?.plate ?? "",
      revenue, directCosts, depreciation,
      netContrib: revenue - directCosts - depreciation,
      bookingCount: vBookings.length,
      depMode: v.depreciation_mode,
    });
  }
  const vehicleStats = vStatsFinal.filter((v) => v.make).sort((a, b) => b.revenue - a.revenue);

  // ── Depreciation summary ─────────────────────────────────────────────────────
  const depConfigured   = vehicles.filter((v) => v.depreciation_mode && v.depreciation_mode !== "none" && v.purchase_price);
  const depNotConfigured = vehicles.filter((v) => !v.depreciation_mode || v.depreciation_mode === "none" || !v.purchase_price);

  // ── Maintenance cost breakdown ────────────────────────────────────────────────
  const TYPE_LABELS: Record<string, string> = {
    oil_change: "Oil change", tires: "Tires", brakes: "Brakes",
    gov_inspection_fee: "Gov. inspection fee", insurance_payment: "Insurance payment",
    bodywork: "Bodywork / paint", cleaning: "Cleaning / detailing", other: "Other",
  };
  const maintByType = new Map<string, number>();
  for (const m of maintRaw ?? []) {
    let cost = 0;
    for (const r of plRows) cost += amortizedCost({ id: m.id, date: m.date, amount: 0, cost: Number(m.cost), covers_from: m.covers_from, covers_until: m.covers_until }, r.year, r.month);
    maintByType.set(m.type, (maintByType.get(m.type) ?? 0) + cost);
  }
  const maintBreakdown = Array.from(maintByType.entries())
    .map(([type, total]) => ({ type, label: TYPE_LABELS[type] ?? type, total }))
    .sort((a, b) => b.total - a.total);
  const maintBreakdownTotal = maintBreakdown.reduce((s, m) => s + m.total, 0);

  // Recent bookings
  const recentBookings = bookings.filter((b) => (b.booking_price ?? 0) > 0).slice(0, 8);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Finance</h1>
          <p className="mt-1 text-sm text-neutral-500">{company.name} · Pro-rata P&amp;L</p>
        </div>
      </div>

      {/* ── Current month stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Earned this month"
          value={fmt(currentRow?.revenue ?? 0)}
          sub="pro-rata (days rented)"
          badge={prevRow ? pct(currentRow?.revenue ?? 0, prevRow.revenue) : undefined}
          badgeColor={prevRow ? pctColor(currentRow?.revenue ?? 0, prevRow.revenue) : undefined}
          footnote="vs last month"
        />
        <StatCard
          label="EBITDA this month"
          value={fmt(currentRow?.ebitda ?? 0)}
          sub="earned − cash costs"
          badgeColor={(currentRow?.ebitda ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}
        />
        <StatCard
          label="Net profit this month"
          value={fmt(currentRow?.netProfit ?? 0)}
          sub="EBITDA − depreciation"
          badgeColor={(currentRow?.netProfit ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}
        />
        <StatCard
          label="Cash collected this month"
          value={fmt(cashThisMonth)}
          sub="based on payment dates"
        />
      </div>

      {/* ── Cash position widget ── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Cash position — right now</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-emerald-50 px-4 py-4">
            <p className="text-xs text-emerald-600 font-medium">Earned (mine)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {fmt(plRows.reduce((s, r) => s + r.revenue, 0) - plRows.reduce((s, r) => s + r.cashCosts + r.depreciation, 0))}
            </p>
            <p className="mt-0.5 text-xs text-emerald-500">net profit, last 12 months</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-4">
            <p className="text-xs text-amber-600 font-medium">Deferred (not yet earned)</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{fmt(deferred)}</p>
            <p className="mt-0.5 text-xs text-amber-500">paid, but rental days ahead</p>
          </div>
          <div className="rounded-xl bg-sky-50 px-4 py-4">
            <p className="text-xs text-sky-600 font-medium">Deposits held</p>
            <p className="mt-1 text-2xl font-bold text-sky-700">{fmt(deposits)}</p>
            <p className="mt-0.5 text-xs text-sky-500">must return to customers</p>
          </div>
        </div>
      </div>

      {/* ── 12-month P&L table ── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">12-month P&amp;L</h2>
        <p className="mb-4 text-xs text-neutral-400">Revenue = pro-rata earned (days rented). Costs = amortized. Depreciation = straight-line per car.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-neutral-500">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 text-right font-medium">Revenue</th>
                <th className="pb-2 text-right font-medium">Cash costs</th>
                <th className="pb-2 text-right font-medium">EBITDA</th>
                <th className="pb-2 text-right font-medium">Depreciation</th>
                <th className="pb-2 text-right font-medium">Net profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plRows.map((r) => {
                const isCurrent = r.month === now.getUTCMonth() && r.year === now.getUTCFullYear();
                return (
                  <tr key={`${r.year}-${r.month}`}
                    className={isCurrent ? "bg-brand-50 font-semibold" : "hover:bg-slate-50"}>
                    <td className="py-2 pr-4 text-sm text-neutral-700">{r.label}{isCurrent && <span className="ml-1.5 text-xs text-brand-600">← now</span>}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(r.revenue)}</td>
                    <td className="py-2 text-right tabular-nums text-red-600">{r.cashCosts > 0 ? `−${fmt(r.cashCosts)}` : "—"}</td>
                    <td className={`py-2 text-right tabular-nums font-medium ${r.ebitda >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {fmt(r.ebitda)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-neutral-400">{r.depreciation > 0 ? `−${fmt(r.depreciation)}` : "—"}</td>
                    <td className={`py-2 text-right tabular-nums font-bold ${r.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {fmt(r.netProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-slate-50 text-sm font-bold">
                <td className="py-2 pr-4 text-neutral-700">12-month total</td>
                <td className="py-2 text-right tabular-nums">{fmt(plRows.reduce((s, r) => s + r.revenue, 0))}</td>
                <td className="py-2 text-right tabular-nums text-red-600">−{fmt(plRows.reduce((s, r) => s + r.cashCosts, 0))}</td>
                <td className={`py-2 text-right tabular-nums ${plRows.reduce((s, r) => s + r.ebitda, 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {fmt(plRows.reduce((s, r) => s + r.ebitda, 0))}
                </td>
                <td className="py-2 text-right tabular-nums text-neutral-400">−{fmt(plRows.reduce((s, r) => s + r.depreciation, 0))}</td>
                <td className={`py-2 text-right tabular-nums ${plRows.reduce((s, r) => s + r.netProfit, 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {fmt(plRows.reduce((s, r) => s + r.netProfit, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Revenue chart ── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Revenue vs costs — 12 months</h2>
        <RevenueChart months={chartData} />
      </div>

      {/* ── Depreciation summary ── */}
      {(depConfigured.length > 0 || depNotConfigured.length > 0) && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-1 text-base font-semibold text-neutral-900">Depreciation</h2>
          <p className="mb-4 text-xs text-neutral-400">
            {depConfigured.length} of {vehicles.length} cars configured · monthly total {fmt(fleetMonthlyDepreciation(vehicles, companyRate, now.getUTCFullYear(), now.getUTCMonth()))}
          </p>
          {depNotConfigured.length > 0 && (
            <p className="mb-3 text-xs text-amber-600">
              ⚠ {depNotConfigured.length} car{depNotConfigured.length > 1 ? "s" : ""} without depreciation setup — open the car and add purchase/value data for full P&amp;L accuracy.
            </p>
          )}
          <div className="text-xs text-neutral-400">Company default rate: <span className="font-semibold text-neutral-700">{companyRate}%/year</span></div>
        </div>
      )}

      {/* ── Fleet profitability ── */}
      {vehicleStats.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-1 text-base font-semibold text-neutral-900">Fleet profitability</h2>
          <p className="mb-4 text-xs text-neutral-400">Last 12 months. Revenue = pro-rata earned. Direct costs = vehicle-specific maintenance (amortized).</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-neutral-500">
                  <th className="pb-2 font-medium">Car</th>
                  <th className="pb-2 text-right font-medium">Bookings</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                  <th className="pb-2 text-right font-medium">Direct costs</th>
                  <th className="pb-2 text-right font-medium">Depreciation</th>
                  <th className="pb-2 text-right font-medium">Net contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehicleStats.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2 pr-4">
                      <p className="font-medium text-neutral-900">{v.make} {v.model}</p>
                      <p className="text-xs text-neutral-400">{v.plate}{!v.depMode || v.depMode === "none" ? " · no depreciation" : ""}</p>
                    </td>
                    <td className="py-2 text-right text-neutral-500">{v.bookingCount}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{fmt(v.revenue)}</td>
                    <td className="py-2 text-right tabular-nums text-red-600">{v.directCosts > 0 ? `−${fmt(v.directCosts)}` : "—"}</td>
                    <td className="py-2 text-right tabular-nums text-neutral-400">{v.depreciation > 0 ? `−${fmt(v.depreciation)}` : "—"}</td>
                    <td className={`py-2 text-right tabular-nums font-bold ${v.netContrib >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {fmt(v.netContrib)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Maintenance breakdown ── */}
      {maintBreakdown.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Maintenance costs — 12 months (amortized)</h2>
          <div className="space-y-2">
            {maintBreakdown.map(({ label, total }) => {
              const pctVal = maintBreakdownTotal > 0 ? (total / maintBreakdownTotal) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-xs text-neutral-600">{label}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${pctVal}%` }} />
                  </div>
                  <span className="w-24 text-right text-sm font-semibold text-neutral-700">{fmt(total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent bookings ── */}
      {recentBookings.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Recent bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-neutral-500">
                  <th className="pb-2 font-medium">Car</th>
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Paid</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2 pr-4">
                      <p className="font-medium text-neutral-800">{b.vehicles?.make} {b.vehicles?.model}</p>
                      <p className="text-xs text-neutral-400">{b.vehicles?.plate}</p>
                    </td>
                    <td className="py-2 text-xs text-neutral-500">
                      {new Date(b.start_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      {" → "}
                      {new Date(b.end_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-2 text-right font-semibold">{fmt(b.booking_price ?? 0)}</td>
                    <td className="py-2 text-right text-xs text-neutral-500">
                      {b.paid_at ? new Date(b.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                    </td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium
                        ${b.status === "returned"  ? "bg-slate-100 text-slate-600" :
                          b.status === "active"    ? "bg-emerald-50 text-emerald-700" :
                          b.status === "confirmed" ? "bg-blue-50 text-blue-700" : "bg-neutral-100 text-neutral-500"}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
