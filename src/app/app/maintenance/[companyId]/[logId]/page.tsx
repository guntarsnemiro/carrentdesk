import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MaintenanceForm } from "../_components/maintenance-form";
import type { OdoMap } from "../_components/maintenance-form";

export const metadata: Metadata = { title: "Edit maintenance entry" };

export default async function EditMaintenancePage({
  params,
}: {
  params: Promise<{ companyId: string; logId: string }>;
}) {
  const { companyId, logId } = await params;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members").select("role")
    .eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
  if (!membership) notFound();

  const [{ data: log }, { data: vehicles }, { data: garages }, { data: odoRows }] = await Promise.all([
    db.from("maintenance_logs").select("*").eq("id", logId).eq("company_id", companyId).maybeSingle(),
    db.from("vehicles").select("id, make, model, plate, year, odometer_km").eq("company_id", companyId).order("make"),
    db.from("garage_presets").select("id, name, phone").eq("company_id", companyId).order("created_at"),
    db.from("odometer_readings").select("vehicle_id, odometer_km, recorded_at, source").eq("company_id", companyId).order("recorded_at", { ascending: false }).limit(500),
  ]);
  if (!log) notFound();

  const lastOdoMap: OdoMap = {};
  for (const r of odoRows ?? []) {
    if (!lastOdoMap[r.vehicle_id]) {
      lastOdoMap[r.vehicle_id] = { km: r.odometer_km, date: r.recorded_at, source: r.source };
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <a href={`/app/maintenance/${companyId}`}
          className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
          ← Maintenance
        </a>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Edit maintenance entry</h1>
      </div>
      <div className="rounded-2xl border border-border bg-white p-6">
        <MaintenanceForm
          companyId={companyId}
          vehicles={vehicles ?? []}
          garages={garages ?? []}
          lastOdoMap={lastOdoMap}
          log={log}
        />
      </div>
    </div>
  );
}
