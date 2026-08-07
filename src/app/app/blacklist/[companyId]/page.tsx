import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { REASON_LABELS, SEVERITY_LABELS } from "@/lib/blacklist-shared";
import { BlacklistCheckForm } from "./_components/blacklist-check-form";

export const metadata: Metadata = { title: "Global Blacklist" };

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending review", cls: "bg-orange-100 text-orange-700" },
  approved: { label: "Approved",       cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected",       cls: "bg-red-100 text-red-700" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function BlacklistPage({
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

  const { data: reports } = await db
    .from("global_blacklist")
    .select("id, reason_category, severity, country, notes_public, status, submitted_at, reviewed_at, reject_reason, local_customer_id")
    .eq("submitted_by_company_id", companyId)
    .order("submitted_at", { ascending: false });

  const customerIds = (reports ?? [])
    .map((r) => r.local_customer_id)
    .filter(Boolean) as string[];

  const { data: customers } = customerIds.length
    ? await db.from("customers").select("id, full_name").in("id", customerIds)
    : { data: [] };

  const customerMap = Object.fromEntries((customers ?? []).map((c) => [c.id, c.full_name]));

  const pending  = (reports ?? []).filter((r) => r.status === "pending").length;
  const approved = (reports ?? []).filter((r) => r.status === "approved").length;

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Global Blacklist</h1>
        <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
        <p className="mt-2 text-sm text-neutral-500">
          Check customers against the network and track reports your company has submitted.
        </p>
      </div>

      {/* Phase B — Check customer */}
      <section className="mb-10 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Check a customer</h2>
        <div className="mt-4">
          <BlacklistCheckForm companyId={companyId} />
        </div>
      </section>

      {/* Phase A — My reports */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-900">My submitted reports</h2>
          {(reports ?? []).length > 0 && (
            <div className="flex gap-2 text-xs">
              {pending > 0 && (
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 font-semibold text-orange-700">
                  {pending} pending
                </span>
              )}
              {approved > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-700">
                  {approved} approved
                </span>
              )}
            </div>
          )}
        </div>

        {(reports ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">No global reports submitted yet.</p>
            <p className="mt-2 text-xs text-neutral-400">
              When you blacklist a customer and choose &ldquo;Report to global blacklist&rdquo;, it will appear here.
            </p>
            <Link
              href={`/app/customers/${companyId}`}
              className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Go to Customers →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports!.map((r) => {
              const sev = SEVERITY_LABELS[r.severity as 1 | 2 | 3];
              const st = STATUS_STYLES[r.status] ?? { label: r.status, cls: "bg-neutral-100 text-neutral-600" };
              const customerName = r.local_customer_id ? customerMap[r.local_customer_id] : null;

              return (
                <div key={r.id} className="rounded-2xl border border-border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${sev.cls}`}>
                          {sev.label}
                        </span>
                        <span className="text-sm font-medium text-neutral-800">
                          {REASON_LABELS[r.reason_category] ?? r.reason_category}
                        </span>
                        {r.country && <span className="text-xs text-neutral-400">{r.country}</span>}
                      </div>

                      {customerName && r.local_customer_id && (
                        <p className="text-sm text-neutral-600">
                          Customer:{" "}
                          <Link
                            href={`/app/customers/${companyId}/${r.local_customer_id}`}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {customerName}
                          </Link>
                        </p>
                      )}

                      {r.notes_public && (
                        <p className="text-sm text-neutral-600 italic">&ldquo;{r.notes_public}&rdquo;</p>
                      )}

                      {r.status === "rejected" && r.reject_reason && (
                        <p className="text-sm text-red-600">
                          Rejection reason: {r.reject_reason}
                        </p>
                      )}

                      <p className="text-xs text-neutral-400">
                        Submitted {fmtDate(r.submitted_at)}
                        {r.reviewed_at ? ` · Reviewed ${fmtDate(r.reviewed_at)}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
