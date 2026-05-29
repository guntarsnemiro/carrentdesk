import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InvoiceEditor } from "../_components/invoice-editor";

export const metadata: Metadata = { title: "New Invoice" };

export default async function NewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { companyId } = await params;
  const { bookingId } = await searchParams;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members").select("role")
    .eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
  if (!membership) notFound();

  const [
    { data: company },
    { data: customers },
    { data: lastInvoice },
  ] = await Promise.all([
    db.from("companies").select(`
      name, invoice_legal_name, invoice_reg_number, invoice_vat_number,
      invoice_address, invoice_bank_name, invoice_iban, invoice_swift,
      invoice_default_vat, invoice_prefix, invoice_payment_terms, invoice_footer_notes,
      invoice_next_number
    `).eq("id", companyId).maybeSingle(),
    db.from("customers").select("id, full_name, email, customer_type, company_name, company_reg_number, company_vat_number, billing_address, address")
      .eq("company_id", companyId).order("full_name"),
    db.from("invoices").select("invoice_number").eq("company_id", companyId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!company) notFound();

  // Generate next invoice number
  const prefix = company.invoice_prefix ?? "INV";
  const nextNum = company.invoice_next_number ?? 1;
  const invoiceNumber = `${prefix}-${String(nextNum).padStart(3, "0")}`;

  // Pre-fill from booking if given
  let bookingItems: Array<{ sort_order: number; description: string; quantity: number; unit_price: number; vat_rate: number; line_total: number }> = [];
  let bookingBuyer = { buyer_name: "", buyer_email: "", buyer_address: "" };

  if (bookingId) {
    const { data: booking } = await db
      .from("bookings")
      .select("*, vehicles(make, model, year, plate), customers(full_name, email, address, customer_type, company_name, billing_address)")
      .eq("id", bookingId).eq("company_id", companyId).maybeSingle();

    if (booking) {
      const vat = company.invoice_default_vat ?? 21;
      const days = Math.ceil(
        (new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / 86400000
      );
      const vehicle = (booking.vehicles as { make: string; model: string; year: number; plate: string } | null);
      const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year} (${vehicle.plate})` : "Vehicle";

      if (booking.booking_price) {
        // booking_price is VAT-inclusive, so back-calculate the ex-VAT unit price:
        // unit_price_excl = total_incl / (1 + vat/100) / days
        // → invoice subtotal + VAT will equal booking_price exactly
        const unitPriceExcl = (booking.booking_price / (1 + vat / 100)) / days;
        bookingItems.push({
          sort_order: 0,
          description: `Car rental — ${vehicleLabel} (${days} day${days !== 1 ? "s" : ""})`,
          quantity: days,
          unit_price: Math.round(unitPriceExcl * 100) / 100,
          vat_rate: vat,
          line_total: Math.round((unitPriceExcl * days) * 100) / 100,
        });
      }
      if (booking.deposit_amount) {
        // Deposit is VAT-exempt (0%)
        bookingItems.push({
          sort_order: bookingItems.length,
          description: `Security deposit`,
          quantity: 1,
          unit_price: booking.deposit_amount,
          vat_rate: 0,
          line_total: booking.deposit_amount,
        });
      }

      const cust = booking.customers as { full_name: string; email: string | null; address: string | null; customer_type?: string | null; company_name?: string | null; billing_address?: string | null } | null;
      if (cust) {
        const isCompany = cust.customer_type === "company";
        bookingBuyer = {
          buyer_name:    isCompany ? (cust.company_name ?? cust.full_name) : cust.full_name,
          buyer_email:   cust.email ?? "",
          buyer_address: cust.billing_address ?? cust.address ?? "",
        };
      }
    }
  }

  const defaultInvoice = {
    invoice_number:    invoiceNumber,
    status:            "draft",
    issue_date:        new Date().toISOString().split("T")[0],
    due_date:          "",
    seller_name:       company.invoice_legal_name ?? company.name ?? "",
    seller_reg_number: company.invoice_reg_number ?? "",
    seller_vat_number: company.invoice_vat_number ?? "",
    seller_address:    company.invoice_address ?? "",
    seller_bank_name:  company.invoice_bank_name ?? "",
    seller_iban:       company.invoice_iban ?? "",
    seller_swift:      company.invoice_swift ?? "",
    buyer_type:        "person" as const,
    buyer_name:        bookingBuyer.buyer_name,
    buyer_reg_number:  "",
    buyer_vat_number:  "",
    buyer_address:     bookingBuyer.buyer_address,
    buyer_email:       bookingBuyer.buyer_email,
    payment_terms:     company.invoice_payment_terms ?? "Due on receipt",
    notes:             company.invoice_footer_notes ?? "",
    currency:          "EUR",
  };

  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="mb-6">
        <Link href={`/app/invoices/${companyId}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Invoices
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">New invoice</h1>
      </div>
      <InvoiceEditor
        companyId={companyId}
        invoice={defaultInvoice}
        items={bookingItems.length ? bookingItems : undefined}
        defaultVat={company.invoice_default_vat ?? 21}
        customers={customers ?? []}
        bookingId={bookingId}
      />
    </div>
  );
}
