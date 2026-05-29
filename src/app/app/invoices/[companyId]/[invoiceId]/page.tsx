import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InvoiceEditor } from "../_components/invoice-editor";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ companyId: string; invoiceId: string }>;
}) {
  const { companyId, invoiceId } = await params;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members").select("role")
    .eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
  if (!membership) notFound();

  const [{ data: invoice }, { data: items }, { data: company }, { data: customers }] = await Promise.all([
    db.from("invoices").select("*").eq("id", invoiceId).eq("company_id", companyId).maybeSingle(),
    db.from("invoice_items").select("*").eq("invoice_id", invoiceId).order("sort_order"),
    db.from("companies").select("invoice_default_vat").eq("id", companyId).maybeSingle(),
    db.from("customers").select("id, full_name, email, customer_type, company_name, company_reg_number, company_vat_number, billing_address, address")
      .eq("company_id", companyId).order("full_name"),
  ]);

  if (!invoice) notFound();

  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/app/invoices/${companyId}`} className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Invoices
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">
            {invoice.invoice_number}
          </h1>
        </div>
        <a href={`/api/invoices/${invoiceId}/pdf`} target="_blank"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
          Download PDF
        </a>
      </div>
      <InvoiceEditor
        companyId={companyId}
        invoice={{
          id:                invoice.id,
          invoice_number:    invoice.invoice_number,
          status:            invoice.status,
          issue_date:        invoice.issue_date,
          due_date:          invoice.due_date ?? "",
          seller_name:       invoice.seller_name,
          seller_reg_number: invoice.seller_reg_number ?? "",
          seller_vat_number: invoice.seller_vat_number ?? "",
          seller_address:    invoice.seller_address ?? "",
          seller_bank_name:  invoice.seller_bank_name ?? "",
          seller_iban:       invoice.seller_iban ?? "",
          seller_swift:      invoice.seller_swift ?? "",
          buyer_type:        invoice.buyer_type as "person" | "company",
          buyer_name:        invoice.buyer_name,
          buyer_reg_number:  invoice.buyer_reg_number ?? "",
          buyer_vat_number:  invoice.buyer_vat_number ?? "",
          buyer_address:     invoice.buyer_address ?? "",
          buyer_email:       invoice.buyer_email ?? "",
          payment_terms:     invoice.payment_terms ?? "Due on receipt",
          notes:             invoice.notes ?? "",
          currency:          invoice.currency,
        }}
        items={(items ?? []).map((it) => ({
          id:          it.id,
          sort_order:  it.sort_order,
          description: it.description,
          quantity:    Number(it.quantity),
          unit_price:  Number(it.unit_price),
          vat_rate:    Number(it.vat_rate),
          line_total:  Number(it.line_total),
        }))}
        defaultVat={company?.invoice_default_vat ?? 21}
        customers={customers ?? []}
      />
    </div>
  );
}
