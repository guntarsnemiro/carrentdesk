import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Maintenance" };

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

const TYPE_COLOR: Record<string, string> = {
  oil_change:         "bg-amber-50 text-amber-700",
  tires:              "bg-blue-50 text-blue-700",
  brakes:             "bg-red-50 text-red-700",
  gov_inspection_fee: "bg-yellow-50 text-yellow-700",
  insurance_payment:  "bg-emerald-50 text-emerald-700",
  bodywork:           "bg-purple-50 text-purple-700",
  cleaning:           "bg-sky-50 text-sky-700",
  other:              "bg-neutral-100 text-neutral-600",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function MaintenancePage({
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

  const { data: logs } = await db
    .from("maintenance_logs")
    .select("id, date, type, description, cost, supplier, vehicle:vehicles(make, model, plate, year)")
    .eq("company_id", companyId)
    .order("date", { ascending: false })
    .limit(500);

  // Stats
  const now        = new Date();
  const thisMonth  = logs?.filter((l) => l.date.slice(0, 7) === now.toISOString().slice(0, 7)) ?? [];
  const thisYear   = logs?.filter((l) => l.date.slice(0, 4) === String(now.getFullYear())) ?? [];
  const totalCostMonth = thisMonth.reduce((s, l) => s + Number(l.cost), 0);
  const totalCostYear  = thisYear.reduce((s, l) => s + Number(l.cost), 0);
  const totalAll       = (logs ?? []).reduce((s, l) => s + Number(l.cost), 0);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Maintenance</h1>
          <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
        </div>
        <Link href={`/app/maintenance/${companyId}/add`}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          + Add entry
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "This month",   value: `€${totalCostMonth.toFixed(2)}`, color: "text-neutral-900" },
          { label: "This year",    value: `€${totalCostYear.toFixed(2)}`,  color: "text-neutral-900" },
          { label: "All time",     value: `€${totalAll.toFixed(2)}`,       color: "text-neutral-900" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-neutral-400">{s.label}</p>
            <p className={`mt-1 text-xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {logs && logs.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-4 py-3 font-medium text-neutral-500">Date</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Car</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Type</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Description</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Supplier</th>
                <th className="px-4 py-3 font-medium text-neutral-500 text-right">Cost</th>
                <th className="px-4 py-3 font-medium text-neutral-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => {
                const v = l.vehicle as { make: string; model: string; plate: string; year: number } | null;
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-neutral-600 whitespace-nowrap">{fmtDate(l.date)}</td>
                    <td className="px-4 py-3">
                      {v ? (
                        <>
                          <p className="font-medium text-neutral-900">{v.make} {v.model}</p>
                          <p className="text-xs text-neutral-400 font-mono">{v.plate}</p>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[l.type] ?? "bg-neutral-100 text-neutral-600"}`}>
                        {TYPE_LABELS[l.type] ?? l.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 max-w-[200px] truncate">{l.description ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{l.supplier ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900 text-right whitespace-nowrap">€{Number(l.cost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/app/maintenance/${companyId}/${l.id}`}
                        className="text-xs text-brand-700 hover:underline">Edit</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-slate-50">
                <td colSpan={5} className="px-4 py-3 text-sm font-medium text-neutral-600">Total shown</td>
                <td className="px-4 py-3 text-sm font-bold text-neutral-900 text-right">
                  €{(logs ?? []).reduce((s, l) => s + Number(l.cost), 0).toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No maintenance entries yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Start tracking service costs for your fleet.</p>
          <Link href={`/app/maintenance/${companyId}/add`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            + Add first entry
          </Link>
        </div>
      )}
    </div>
  );
}
