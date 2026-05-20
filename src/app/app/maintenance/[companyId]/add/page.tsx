import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MaintenanceForm } from "../_components/maintenance-form";

export const metadata: Metadata = { title: "Add maintenance entry" };

export default async function AddMaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const { companyId } = await params;
  const { vehicle: defaultVehicleId } = await searchParams;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members").select("role")
    .eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
  if (!membership) notFound();

  const { data: vehicles } = await db
    .from("vehicles")
    .select("id, make, model, plate, year")
    .eq("company_id", companyId)
    .neq("status", "retired")
    .order("make");

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <a href={`/app/maintenance/${companyId}`}
          className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
          ← Maintenance
        </a>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Add maintenance entry</h1>
      </div>
      <div className="rounded-2xl border border-border bg-white p-6">
        <MaintenanceForm companyId={companyId} vehicles={vehicles ?? []} defaultVehicleId={defaultVehicleId} />
      </div>
    </div>
  );
}
