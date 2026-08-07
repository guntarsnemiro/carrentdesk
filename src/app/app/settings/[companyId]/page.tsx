import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { SettingsForm } from "./_components/settings-form";
import { LocationsManager } from "../../profile/[companyId]/_components/locations-manager";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
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
    .from("companies").select(`
      id, name,
      invoice_legal_name, invoice_reg_number, invoice_vat_number, invoice_address,
      invoice_bank_name, invoice_iban, invoice_swift,
      invoice_default_vat, invoice_prefix, invoice_payment_terms, invoice_footer_notes,
      default_depreciation_rate
    `)
    .eq("id", companyId).maybeSingle();
  if (!company) notFound();

  const { data: allLocations } = await db
    .from("locations")
    .select("id, address, is_primary")
    .eq("company_id", companyId)
    .order("created_at");

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
      </div>
      <SettingsForm companyId={companyId} invoiceDefaults={company} />

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Pickup &amp; return locations</h2>
        <p className="mt-1 text-sm text-neutral-500">
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
