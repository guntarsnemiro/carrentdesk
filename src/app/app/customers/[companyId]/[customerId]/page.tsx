import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CustomerForm } from "../_components/customer-form";

export const metadata: Metadata = { title: "Edit Customer" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ companyId: string; customerId: string }>;
}) {
  const { companyId, customerId } = await params;

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

  const { data: customer } = await db
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!customer) notFound();

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <Link href={`/app/customers/${companyId}`}
          className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">{customer.full_name}</h1>
        {customer.blacklisted && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
            ⚠ Blacklisted{customer.blacklist_reason ? ` — ${customer.blacklist_reason}` : ""}
          </div>
        )}
      </div>
      <CustomerForm companyId={companyId} customer={customer} />
    </div>
  );
}
