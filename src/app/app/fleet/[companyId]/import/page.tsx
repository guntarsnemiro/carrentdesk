import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { FleetImport } from "./_components/fleet-import";

export const metadata: Metadata = { title: "Import Vehicles" };

export default async function ImportPage({
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

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <Link href={`/app/fleet/${companyId}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Fleet
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Import vehicles</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Upload an Excel or CSV file to add multiple vehicles at once.
        </p>
      </div>
      <FleetImport companyId={companyId} />
    </div>
  );
}
