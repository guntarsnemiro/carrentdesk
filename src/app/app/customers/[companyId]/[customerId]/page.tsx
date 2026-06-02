import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CustomerForm } from "../_components/customer-form";
import { checkGlobalBlacklist } from "@/lib/blacklist";
import { REASON_LABELS, SEVERITY_LABELS } from "@/lib/blacklist-shared";

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

  const globalMatches = await checkGlobalBlacklist(
    customer.id_number,
    customer.driver_license_number
  );
  const worstSeverity = globalMatches.length
    ? Math.max(...globalMatches.map((m) => m.severity)) as 1 | 2 | 3
    : null;

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <Link href={`/app/customers/${companyId}`}
          className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Customers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">{customer.full_name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {customer.blacklisted && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              ⚠ Blacklisted{customer.blacklist_reason ? ` — ${customer.blacklist_reason}` : ""}
            </div>
          )}
          {globalMatches.length > 0 && worstSeverity && (
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${SEVERITY_LABELS[worstSeverity].cls}`}>
              🌐 Global network: {SEVERITY_LABELS[worstSeverity].label} — reported by {globalMatches.length} {globalMatches.length === 1 ? "company" : "companies"}
            </div>
          )}
        </div>
      </div>

      {/* Global blacklist detail */}
      {globalMatches.length > 0 && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-orange-900">
            ⚠ Flagged on CarRentDesk Global Blacklist
          </h3>
          <div className="space-y-2">
            {globalMatches.map((m) => {
              const sev = SEVERITY_LABELS[m.severity as 1|2|3];
              return (
                <div key={m.id} className="flex items-start gap-3 rounded-lg bg-white/60 px-3 py-2.5">
                  <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${sev.cls}`}>
                    {sev.label}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {REASON_LABELS[m.reason_category] ?? m.reason_category}
                      {m.country ? ` · ${m.country}` : ""}
                    </p>
                    {m.notes_public && (
                      <p className="mt-0.5 text-xs text-neutral-600 italic">{m.notes_public}</p>
                    )}
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Reported {new Date(m.submitted_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-orange-700">
            Document numbers are hashed — this match was made without sharing personal data between companies.
          </p>
        </div>
      )}

      <CustomerForm companyId={companyId} customer={customer} />
    </div>
  );
}
