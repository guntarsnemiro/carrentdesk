import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./_components/profile-edit-form";
import { LocationsManager } from "./_components/locations-manager";

export const metadata: Metadata = { title: "Edit profile" };

interface Props {
  params: Promise<{ companyId: string }>;
}

export default async function ProfileEditPage({ params }: Props) {
  const { companyId } = await params;

  // Auth guard
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();

  // Verify this user is a member of the requested company
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!membership) notFound();

  // Load company + primary location
  const { data: company } = await db
    .from("companies")
    .select("id, name, slug, city, country, status, description, phone, whatsapp, website, email, founded_year")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) notFound();

  const { data: location } = await db
    .from("locations")
    .select("id, address, lat, lng")
    .eq("company_id", companyId)
    .eq("is_primary", true)
    .maybeSingle();

  const { data: allLocations } = await db
    .from("locations")
    .select("id, address, is_primary")
    .eq("company_id", companyId)
    .order("created_at");

  const { data: fleet } = await db
    .from("company_fleet_summary")
    .select("fleet_count_min, fleet_count_max, fleet_description, transmission_mix, fuel_mix, age_range")
    .eq("company_id", companyId)
    .maybeSingle();

  const { data: amenityRows } = await db
    .from("company_amenities")
    .select("amenity_key, value")
    .eq("company_id", companyId);

  const amenities: Record<string, boolean> = {};
  for (const row of amenityRows ?? []) {
    amenities[row.amenity_key] = row.value;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">My listing</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Changes are saved immediately and appear on your public profile at{" "}
          <a href={`/c/${company.slug}`} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline-offset-2 hover:underline">
            carrentdesk.com/c/{company.slug}
          </a>
        </p>
      </div>

      <ProfileEditForm
        company={company}
        location={location ?? null}
        fleet={fleet ?? null}
        amenities={amenities}
      />

      {/* Preset pickup/return locations */}
      <div className="mt-10 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Pickup &amp; return locations</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Save frequently used locations so you can select them quickly when creating bookings.
        </p>
        <div className="mt-4">
          <LocationsManager
            companyId={companyId}
            initial={(allLocations ?? []).filter((l) => !l.is_primary)}
          />
        </div>
      </div>
    </div>
  );
}
