import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { VehicleForm } from "../_components/vehicle-form";

export const metadata: Metadata = { title: "Edit vehicle" };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ companyId: string; vehicleId: string }>;
}) {
  const { companyId, vehicleId } = await params;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members").select("role")
    .eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
  if (!membership) notFound();

  const { data: vehicle } = await db
    .from("vehicles").select("*")
    .eq("id", vehicleId).eq("company_id", companyId).maybeSingle();
  if (!vehicle) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <a href={`/app/fleet/${companyId}`}
          className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
          ← Vehicles
        </a>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="mt-1 font-mono text-sm text-neutral-500">{vehicle.plate}</p>
      </div>
      <VehicleForm companyId={companyId} vehicle={vehicle} />
    </div>
  );
}
