import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, CATEGORY_COLOR } from "./_components/expense-form";

export const metadata: Metadata = { title: "Business Expenses" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type ExpenseCategory = "salary" | "tax" | "rent" | "phone_internet" | "accounting_legal" | "supplies_stock" | "company_insurance" | "other";

export default async function ExpensesPage({
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

  const { data: expenses } = await db
    .from("company_expenses")
    .select("id, date, category, description, amount, supplier, invoice_number, quantity, unit, is_recurring")
    .eq("company_id", companyId)
    .order("date", { ascending: false })
    .limit(500);

  const now = new Date();
  const allExpenses = expenses ?? [];
  const thisMonth = allExpenses.filter((e) => e.date.slice(0, 7) === now.toISOString().slice(0, 7));
  const thisYear  = allExpenses.filter((e) => e.date.slice(0, 4) === String(now.getFullYear()));

  const totalMonth = thisMonth.reduce((s, e) => s + Number(e.amount), 0);
  const totalYear  = thisYear.reduce((s, e) => s + Number(e.amount), 0);
  const totalAll   = allExpenses.reduce((s, e) => s + Number(e.amount), 0);

  // Category breakdown for this year
  const byCategory = (Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => ({
    cat,
    total: thisYear.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Business Expenses</h1>
          <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
        </div>
        <Link href={`/app/expenses/${companyId}/add`}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          + Add expense
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

      {/* Expense list */}
      {allExpenses.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-4 py-3 font-medium text-neutral-500">Date</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Category</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Description</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Supplier</th>
                <th className="px-4 py-3 font-medium text-neutral-500 text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-neutral-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-neutral-600 whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[e.category as ExpenseCategory] ?? "bg-neutral-100 text-neutral-600"}`}>
                      {CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category}
                    </span>
                    {e.is_recurring && <span className="ml-1.5 text-xs text-neutral-400">↻</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-900 max-w-[220px]">
                    <p className="truncate">{e.description}</p>
                    {e.quantity != null && (
                      <p className="text-xs text-neutral-400">{e.quantity} {e.unit ?? ""}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{e.supplier ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-neutral-900 text-right whitespace-nowrap">
                    €{Number(e.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/expenses/${companyId}/${e.id}`}
                      className="text-xs text-brand-700 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-slate-50">
                <td colSpan={4} className="px-4 py-3 text-sm font-medium text-neutral-600">Total shown</td>
                <td className="px-4 py-3 text-sm font-bold text-neutral-900 text-right">
                  €{totalAll.toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No business expenses logged yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Track salaries, rent, phone bills, taxes, and more.</p>
          <Link href={`/app/expenses/${companyId}/add`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            + Add first expense
          </Link>
        </div>
      )}
    </div>
  );
}
