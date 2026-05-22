import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, CATEGORY_COLOR, type CostCategory } from "./_components/expense-form";
import { PayeeManager } from "./_components/payee-manager";
import { RecurringGenerator } from "./_components/recurring-generator";

export const metadata: Metadata = { title: "Costs" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CostsPage({
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
    .from("companies").select("id, name").eq("id", companyId).maybeSingle();
  if (!company) notFound();

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const firstOfMonth = `${currentYM}-01`;
  const currentMonthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const [{ data: expenses }, { data: payees }, { data: maintRaw }] = await Promise.all([
    db.from("company_expenses")
      .select("id, date, category, description, amount, supplier, invoice_number, quantity, unit, is_recurring, notes, vehicle_id, vehicles(make, model, plate)")
      .eq("company_id", companyId)
      .order("date", { ascending: false })
      .limit(500),
    db.from("expense_payees")
      .select("id, name, notes")
      .eq("company_id", companyId)
      .order("created_at"),
    db.from("maintenance_logs")
      .select("id, date, type, description, cost, vehicle_id, vehicle:vehicles(make, model, plate)")
      .eq("company_id", companyId)
      .gt("cost", 0)
      .order("date", { ascending: false })
      .limit(500),
  ]);

  // Map maintenance types to cost categories for display
  const MAINT_TYPE_LABEL: Record<string, string> = {
    oil_change: "Service & repair", tires: "Service & repair", brakes: "Service & repair",
    gov_inspection_fee: "Gov. inspection", insurance_payment: "Car insurance",
    bodywork: "Service & repair", cleaning: "Service & repair", other: "Service & repair",
  };
  const MAINT_TYPE_CAT: Record<string, CostCategory> = {
    oil_change: "service_repair", tires: "service_repair", brakes: "service_repair",
    gov_inspection_fee: "gov_inspection", insurance_payment: "car_insurance",
    bodywork: "service_repair", cleaning: "service_repair", other: "service_repair",
  };

  type CostRow = {
    id: string; date: string; category: CostCategory; label: string;
    description: string; amount: number; supplier: string | null;
    is_recurring: boolean; vehicle: { make: string; model: string; plate: string } | null;
    href: string; source: "expense" | "maintenance";
  };

  const expenseRows: CostRow[] = (expenses ?? []).map((e) => ({
    id: e.id, date: e.date,
    category: (e.category ?? "other") as CostCategory,
    label: CATEGORY_LABELS[(e.category ?? "other") as CostCategory] ?? e.category,
    description: e.description, amount: Number(e.amount),
    supplier: e.supplier, is_recurring: e.is_recurring,
    vehicle: (e.vehicles as { make: string; model: string; plate: string } | null) ?? null,
    href: `/app/expenses/${companyId}/${e.id}`,
    source: "expense",
  }));

  const maintRows: CostRow[] = (maintRaw ?? []).map((m) => ({
    id: m.id, date: m.date,
    category: MAINT_TYPE_CAT[m.type] ?? "service_repair",
    label: MAINT_TYPE_LABEL[m.type] ?? "Service & repair",
    description: m.description ?? m.type,
    amount: Number(m.cost), supplier: null, is_recurring: false,
    vehicle: (m.vehicle as { make: string; model: string; plate: string } | null) ?? null,
    href: `/app/maintenance/${companyId}/${m.id}`,
    source: "maintenance",
  }));

  const allCosts = [...expenseRows, ...maintRows].sort((a, b) => b.date.localeCompare(a.date));

  const thisMonth = allCosts.filter((e) => e.date.slice(0, 7) === currentYM);
  const thisYear  = allCosts.filter((e) => e.date.slice(0, 4) === String(now.getFullYear()));

  const totalMonth = thisMonth.reduce((s, e) => s + e.amount, 0);
  const totalYear  = thisYear.reduce((s, e) => s + e.amount, 0);
  const totalAll   = allCosts.reduce((s, e) => s + e.amount, 0);

  // Recurring generator (expenses only)
  const recurringExpenses = (expenses ?? []).filter((e) => e.is_recurring);
  const thisMonthKeys = thisMonth.map((e) => `${e.category}||${e.description}`);

  // Category breakdown this year
  const byCategory = Object.keys(CATEGORY_LABELS).map((cat) => ({
    cat: cat as CostCategory,
    total: thisYear.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Costs</h1>
          <p className="mt-1 text-sm text-neutral-500">{company.name} · all spending in one place</p>
        </div>
        <Link href={`/app/expenses/${companyId}/add`}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          + Add cost
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "This month", value: `€${totalMonth.toFixed(2)}` },
          { label: "This year",  value: `€${totalYear.toFixed(2)}`  },
          { label: "All time",   value: `€${totalAll.toFixed(2)}`   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-neutral-400">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">This year by category</h2>
          <div className="space-y-2">
            {byCategory.map(({ cat, total }) => {
              const pct = totalYear > 0 ? (total / totalYear) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[cat]}`}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-700 w-20 text-right">€{total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recurring generator */}
      <RecurringGenerator
        companyId={companyId}
        recurring={recurringExpenses}
        thisMonthKeys={thisMonthKeys}
        currentMonthLabel={currentMonthLabel}
        firstOfMonth={firstOfMonth}
      />

      {/* Saved payees hint */}
      {(payees ?? []).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <span className="text-xs text-neutral-400 self-center mr-1">Saved payees:</span>
          {(payees ?? []).map((p) => (
            <span key={p.id} className="rounded-full border border-border bg-slate-50 px-2.5 py-0.5 text-xs text-neutral-600">{p.name}</span>
          ))}
        </div>
      )}

      {/* Cost list */}
      {allCosts.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-4 py-3 font-medium text-neutral-500">Date</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Category</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Description</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Car</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Supplier</th>
                <th className="px-4 py-3 font-medium text-neutral-500 text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-neutral-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allCosts.map((e) => (
                <tr key={`${e.source}-${e.id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-neutral-600 whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[e.category] ?? "bg-neutral-100 text-neutral-600"}`}>
                      {e.label}
                    </span>
                    {e.is_recurring && <span className="ml-1.5 text-xs text-neutral-400">↻</span>}
                    {e.source === "maintenance" && (
                      <span className="ml-1.5 text-xs text-neutral-400" title="From service log">🔧</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-900 max-w-[200px]">
                    <p className="truncate">{e.description}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 whitespace-nowrap">
                    {e.vehicle ? (
                      <span className="font-mono text-xs">{e.vehicle.plate}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{e.supplier ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-neutral-900 text-right whitespace-nowrap">
                    €{e.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={e.href} className="text-xs text-brand-700 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-slate-50">
                <td colSpan={5} className="px-4 py-3 text-sm font-medium text-neutral-600">Total shown</td>
                <td className="px-4 py-3 text-sm font-bold text-neutral-900 text-right">€{totalAll.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No costs logged yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Track car insurance, repairs, salaries, rent, and more.</p>
          <Link href={`/app/expenses/${companyId}/add`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            + Add first cost
          </Link>
        </div>
      )}

      {/* Payee manager */}
      <div className="mt-10 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Saved payees</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Save frequent payees — insurers, government agencies, landlord, phone company — for quick selection when adding costs.
        </p>
        <div className="mt-4">
          <PayeeManager companyId={companyId} initial={payees ?? []} />
        </div>
      </div>
    </div>
  );
}
