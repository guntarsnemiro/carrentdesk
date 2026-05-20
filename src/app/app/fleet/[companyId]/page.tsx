import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cars" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function currentBookValue(
  v: { purchase_price: number | null; purchase_date: string | null; depreciation_rate: number | null; residual_value: number | null; depreciation_mode: string | null },
  companyRate: number,
): number | null {
  if (!v.purchase_price || !v.purchase_date || !v.depreciation_mode || v.depreciation_mode === "none") return null;
  const rate      = v.depreciation_rate ?? companyRate;
  const residual  = v.residual_value ?? 0;
  const depreciable = Math.max(0, v.purchase_price - residual);
  const monthlyDep  = depreciable * (rate / 100 / 12);
  const now = new Date();
  const pd  = new Date(v.purchase_date);
  const monthsElapsed = (now.getFullYear() - pd.getFullYear()) * 12 + (now.getMonth() - pd.getMonth());
  return Math.max(residual, v.purchase_price - monthlyDep * Math.max(0, monthsElapsed));
}

function editedLabel(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000; // minutes
  if (diff < 2)   return "just now";
  if (diff < 60)  return `${Math.floor(diff)}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return "";
}

function alertClass(iso: string | null) {
  if (!iso) return "";
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0)  return "text-red-600 font-semibold";
  if (days <= 30) return "text-amber-600 font-semibold";
  return "text-neutral-600";
}

const STATUS_STYLES: Record<string, string> = {
  available:   "bg-emerald-50 text-emerald-700",
  rented:      "bg-blue-50 text-blue-700",
  maintenance: "bg-amber-50 text-amber-700",
  retired:     "bg-neutral-100 text-neutral-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  economy:  "Economy",
  compact:  "Compact",
  midsize:  "Midsize",
  suv:      "SUV",
  van:      "Van",
  luxury:   "Luxury",
  other:    "Other",
};

export default async function FleetPage({
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
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!membership) notFound();

  const { data: company } = await db
    .from("companies")
    .select("id, name, default_depreciation_rate")
    .eq("id", companyId)
    .maybeSingle();
  if (!company) notFound();

  const companyRate = company.default_depreciation_rate ?? 20;

  const { data: vehicles } = await db
    .from("vehicles")
    .select("id, make, model, year, plate, color, fuel, seats, category, status, odometer_km, vin, registration_number, gov_inspection_next, insurance_valid_until, updated_at, purchase_price, purchase_date, depreciation_rate, residual_value, depreciation_mode")
    .eq("company_id", companyId)
    .order("make")
    .order("model")
    .order("plate"); // stable tiebreaker — plate never changes

  const counts = {
    total:       vehicles?.length ?? 0,
    available:   vehicles?.filter((v) => v.status === "available").length ?? 0,
    rented:      vehicles?.filter((v) => v.status === "rented").length ?? 0,
    maintenance: vehicles?.filter((v) => v.status === "maintenance").length ?? 0,
  };

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Cars</h1>
          <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/fleet/${companyId}/import`}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-slate-50"
          >
            ↑ Import from Excel
          </Link>
          <Link
            href={`/app/fleet/${companyId}/add`}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            + Add car
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",       value: counts.total,       color: "text-neutral-900" },
          { label: "Available",   value: counts.available,   color: "text-emerald-700" },
          { label: "Rented",      value: counts.rented,      color: "text-blue-700"    },
          { label: "Maintenance", value: counts.maintenance, color: "text-amber-700"   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-neutral-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cars table */}
      {vehicles && vehicles.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-4 py-3 font-medium text-neutral-500">Car</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Plate</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Reg. No.</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Fuel</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Color</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Seats</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Category</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Odometer</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Book value</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Gov. Inspection</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Insurance until</th>
                <th className="px-4 py-3 font-medium text-neutral-500">VIN</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Status</th>
                <th className="px-4 py-3 font-medium text-neutral-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{v.make} {v.model}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {v.year}
                      {editedLabel(v.updated_at) && (
                        <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-brand-700 font-medium">
                          ✓ edited {editedLabel(v.updated_at)}
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-neutral-700">{v.plate}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{v.registration_number ?? "—"}</td>
                  <td className="px-4 py-3 text-sm capitalize text-neutral-600">{v.fuel ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{v.color ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{v.seats ?? "—"}</td>
                  <td className="px-4 py-3 text-sm capitalize text-neutral-500">{v.category ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {v.odometer_km != null ? `${v.odometer_km.toLocaleString()} km` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(() => {
                      const bv = currentBookValue(v, companyRate);
                      if (bv === null) return <span className="text-neutral-300">—</span>;
                      return (
                        <div>
                          <p className="font-semibold text-neutral-800">€{Math.round(bv).toLocaleString()}</p>
                          <p className="text-xs text-neutral-400">{v.depreciation_mode === "current_value" ? "from est. value" : "from purchase"}</p>
                        </div>
                      );
                    })()}
                  </td>
                  <td className={`px-4 py-3 text-sm ${alertClass(v.gov_inspection_next)}`}>
                    {fmtDate(v.gov_inspection_next)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${alertClass(v.insurance_valid_until)}`}>
                    {fmtDate(v.insurance_valid_until)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-400">{v.vin ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[v.status] ?? ""}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/fleet/${companyId}/${v.id}`} className="text-xs text-brand-700 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No cars yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Add your first car to get started.</p>
          <Link
            href={`/app/fleet/${companyId}/add`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            + Add car
          </Link>
        </div>
      )}
    </div>
  );
}
