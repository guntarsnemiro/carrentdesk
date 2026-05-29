import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft:     { label: "Draft",     cls: "bg-neutral-100 text-neutral-600" },
  sent:      { label: "Sent",      cls: "bg-blue-50 text-blue-700" },
  paid:      { label: "Paid",      cls: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-600" },
};

export default async function InvoicesPage({
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

  const { data: invoices } = await db
    .from("invoices")
    .select("id, invoice_number, status, issue_date, due_date, buyer_name, buyer_type, total, currency, sent_at, paid_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const list = invoices ?? [];
  const totalPaid = list.filter(i => i.status === "paid").reduce((s, i) => s + (i.total ?? 0), 0);
  const totalSent = list.filter(i => i.status === "sent").reduce((s, i) => s + (i.total ?? 0), 0);

  return (
    <div className="px-6 py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Invoices</h1>
          <p className="mt-1 text-sm text-neutral-500">{list.length} total</p>
        </div>
        <Link
          href={`/app/invoices/${companyId}/new`}
          className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + New invoice
        </Link>
      </div>

      {/* Summary */}
      {list.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Awaiting payment", value: totalSent, cls: "text-blue-700" },
            { label: "Collected", value: totalPaid, cls: "text-green-700" },
            { label: "Total invoiced", value: list.filter(i => i.status !== "cancelled").reduce((s, i) => s + (i.total ?? 0), 0), cls: "text-neutral-900" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-neutral-500">{label}</p>
              <p className={`mt-1 text-xl font-bold ${cls}`}>€{value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <p className="text-neutral-400">No invoices yet.</p>
          <Link
            href={`/app/invoices/${companyId}/new`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((inv) => {
                const st = STATUS_LABEL[inv.status] ?? STATUS_LABEL.draft;
                return (
                  <tr key={inv.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-neutral-900">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{inv.buyer_name}</p>
                      {inv.buyer_type === "company" && (
                        <p className="text-xs text-neutral-400">Company</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {fmtDate(inv.issue_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                      €{(inv.total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/app/invoices/${companyId}/${inv.id}`}
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
