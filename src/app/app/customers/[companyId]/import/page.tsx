import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CustomerImport } from "./_components/customer-import";

export const metadata: Metadata = { title: "Import Customers" };

export default async function ImportCustomersPage({
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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <a href={`/app/customers/${companyId}`}
          className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
          ← Customers
        </a>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Import customers from Excel</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Upload an .xlsx or .csv file. Existing customers matched by phone number will be updated.
        </p>
      </div>
      <CustomerImport companyId={companyId} />
    </div>
  );
}
