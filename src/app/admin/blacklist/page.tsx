import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { REASON_LABELS, SEVERITY_LABELS } from "@/lib/blacklist-shared";
import { BlacklistReviewActions } from "./_components/blacklist-review-actions";

export const metadata: Metadata = { title: "Global Blacklist — Admin" };

const ADMIN_EMAILS = ["info@carrentdesk.com", "guntarsnemiro@inbox.lv"];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminBlacklistPage() {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    redirect("/app/login");
  }

  const db = createServiceRoleClient();

  const [{ data: pending }, { data: approved }, { data: rejected }] = await Promise.all([
    db.from("global_blacklist")
      .select("id, reason_category, severity, country, notes_public, submitted_at, id_hash, license_hash, submitted_by_company_id, local_customer_id")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true }),
    db.from("global_blacklist")
      .select("id, reason_category, severity, country, notes_public, submitted_at, reviewed_at")
      .eq("status", "approved")
      .order("reviewed_at", { ascending: false })
      .limit(50),
    db.from("global_blacklist")
      .select("id, reason_category, severity, country, submitted_at, reviewed_at, reject_reason")
      .eq("status", "rejected")
      .order("reviewed_at", { ascending: false })
      .limit(30),
  ]);

  // Enrich pending with company names
  const companyIds = [...new Set((pending ?? []).map((r) => r.submitted_by_company_id))];
  const { data: companies } = companyIds.length
    ? await db.from("companies").select("id, name").in("id", companyIds)
    : { data: [] };
  const companyMap = Object.fromEntries((companies ?? []).map((c) => [c.id, c.name]));

  // Enrich pending with customer info
  const customerIds = (pending ?? []).map((r) => r.local_customer_id).filter(Boolean) as string[];
  const { data: customers } = customerIds.length
    ? await db.from("customers").select("id, full_name, id_number, driver_license_number, phone").in("id", customerIds)
    : { data: [] };
  const customerMap = Object.fromEntries((customers ?? []).map((c) => [c.id, c]));

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Global Blacklist</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Review and approve company-submitted reports. Only approved entries are visible to other companies.
        </p>
      </div>

      {/* ── Pending ── */}
      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">
          Pending review
          {(pending ?? []).length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {pending!.length}
            </span>
          )}
        </h2>
        {(pending ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-neutral-400">
            No pending reports. 
          </div>
        ) : (
          <div className="space-y-4">
            {pending!.map((r) => {
              const customer = r.local_customer_id ? customerMap[r.local_customer_id] : null;
              const sev = SEVERITY_LABELS[r.severity as 1|2|3];
              return (
                <div key={r.id} className="rounded-2xl border border-orange-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${sev.cls}`}>
                          {sev.label}
                        </span>
                        <span className="text-sm font-semibold text-neutral-800">
                          {REASON_LABELS[r.reason_category] ?? r.reason_category}
                        </span>
                        {r.country && <span className="text-xs text-neutral-400">{r.country}</span>}
                      </div>

                      {/* Submitted by */}
                      <p className="text-xs text-neutral-500">
                        Submitted by: <strong>{companyMap[r.submitted_by_company_id] ?? r.submitted_by_company_id}</strong>
                        {" · "}{fmtDate(r.submitted_at)}
                      </p>

                      {/* Customer info (admin-only) */}
                      {customer && (
                        <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs space-y-0.5">
                          <p className="font-semibold text-neutral-700">{customer.full_name}</p>
                          {customer.phone && <p className="text-neutral-500">📞 {customer.phone}</p>}
                          {customer.id_number && <p className="font-mono text-neutral-500">ID: {customer.id_number}</p>}
                          {customer.driver_license_number && <p className="font-mono text-neutral-500">License: {customer.driver_license_number}</p>}
                          <p className="text-neutral-400 pt-1">Stored hashes only — document numbers never shared publicly.</p>
                        </div>
                      )}

                      {r.notes_public && (
                        <p className="text-sm text-neutral-600 italic">&ldquo;{r.notes_public}&rdquo;</p>
                      )}
                    </div>

                    <BlacklistReviewActions reportId={r.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Approved ── */}
      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold text-neutral-900">
          Approved ({(approved ?? []).length})
        </h2>
        {(approved ?? []).length === 0 ? (
          <p className="text-sm text-neutral-400">None yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Country</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Approved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {approved!.map((r) => {
                  const sev = SEVERITY_LABELS[r.severity as 1|2|3];
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium text-neutral-800">{REASON_LABELS[r.reason_category] ?? r.reason_category}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sev.cls}`}>{sev.label}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{r.country ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-500">{r.reviewed_at ? fmtDate(r.reviewed_at) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Rejected ── */}
      {(rejected ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-neutral-900">Recently rejected ({(rejected ?? []).length})</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Reject note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rejected!.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-neutral-600">{REASON_LABELS[r.reason_category] ?? r.reason_category}</td>
                    <td className="px-4 py-3 text-neutral-500 italic">{r.reject_reason ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-400">{r.reviewed_at ? fmtDate(r.reviewed_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
