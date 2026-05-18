import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Customers" };

const LANGUAGE_LABELS: Record<string, string> = {
  en: "EN", lv: "LV", ru: "RU", other: "—",
};

export default async function CustomersPage({
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

  const { data: customers } = await db
    .from("customers")
    .select("id, full_name, phone, email, language, blacklisted, created_at")
    .eq("company_id", companyId)
    .order("full_name");

  const total      = customers?.length ?? 0;
  const blacklisted = customers?.filter((c) => c.blacklisted).length ?? 0;

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Customers</h1>
          <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
        </div>
        <Link
          href={`/app/customers/${companyId}/add`}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + Add customer
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-white px-4 py-3">
          <p className="text-xs text-neutral-400">Total</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{total}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-4 py-3">
          <p className="text-xs text-neutral-400">Blacklisted</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{blacklisted}</p>
        </div>
      </div>

      {/* List */}
      {customers && customers.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-4 py-3 font-medium text-neutral-500">Name</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Phone</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Email</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Lang</th>
                <th className="px-4 py-3 font-medium text-neutral-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">{c.full_name}</span>
                      {c.blacklisted && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Blacklisted
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.phone}</td>
                  <td className="px-4 py-3 text-neutral-500">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {c.language ? LANGUAGE_LABELS[c.language] ?? c.language : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/app/customers/${companyId}/${c.id}`}
                      className="text-xs text-brand-700 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No customers yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Add your first customer to get started.</p>
          <Link
            href={`/app/customers/${companyId}/add`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            + Add customer
          </Link>
        </div>
      )}
    </div>
  );
}
