import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ExpenseForm } from "../_components/expense-form";

export const metadata: Metadata = { title: "Add cost" };

export default async function AddExpensePage({
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

  const [{ data: payees }, { data: vehicles }] = await Promise.all([
    db.from("expense_payees").select("id, name").eq("company_id", companyId).order("created_at"),
    db.from("vehicles").select("id, make, model, plate").eq("company_id", companyId).neq("status", "retired").order("make"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <a href={`/app/expenses/${companyId}`}
          className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
          ← Costs
        </a>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">Add cost</h1>
      </div>
      <div className="rounded-2xl border border-border bg-white p-6">
        <ExpenseForm companyId={companyId} payees={payees ?? []} vehicles={vehicles ?? []} />
      </div>
    </div>
  );
}
