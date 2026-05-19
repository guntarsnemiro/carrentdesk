import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cars" };

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
    .select("id, name")
    .eq("id", companyId)
    .maybeSingle();
  if (!company) notFound();

  const { data: vehicles } = await db
    .from("vehicles")
    .select("id, make, model, year, plate, color, fuel, seats, category, status, odometer_km, vin")
    .eq("company_id", companyId)
    .order("make")
    .order("model");

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
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-4 py-3 font-medium text-neutral-500">Car</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Plate</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Fuel</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Color</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Seats</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Category</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Odometer</th>
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
                    <p className="mt-0.5 text-xs text-neutral-400">{v.year}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-neutral-700">{v.plate}</td>
                  <td className="px-4 py-3 text-sm capitalize text-neutral-600">{v.fuel ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{v.color ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{v.seats ?? "—"}</td>
                  <td className="px-4 py-3 text-sm capitalize text-neutral-500">{v.category ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {v.odometer_km != null ? `${v.odometer_km.toLocaleString()} km` : "—"}
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
