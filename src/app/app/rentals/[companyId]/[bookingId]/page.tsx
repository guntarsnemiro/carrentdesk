import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BookingForm } from "../_components/booking-form";
import { checkGlobalBlacklist } from "@/lib/blacklist";
import { REASON_LABELS, SEVERITY_LABELS } from "@/lib/blacklist-shared";

export const metadata: Metadata = { title: "Edit Booking" };

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ companyId: string; bookingId: string }>;
}) {
  const { companyId, bookingId } = await params;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members").select("role")
    .eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
  if (!membership) notFound();

  const [{ data: booking }, { data: vehicles }, { data: locs }] = await Promise.all([
    db.from("bookings").select("*").eq("id", bookingId).eq("company_id", companyId).maybeSingle(),
    db.from("vehicles").select("id, make, model, year, plate").eq("company_id", companyId).neq("status", "retired").order("make").order("model"),
    db.from("locations").select("address, is_primary").eq("company_id", companyId).order("created_at"),
  ]);
  if (!booking) notFound();

  const locationPresets = (locs ?? []).map((l) => l.address);

  const { data: customer } = booking.customer_id ? await db
    .from("customers")
    .select("id, full_name, phone, blacklisted, blacklist_reason, id_number, driver_license_number")
    .eq("id", booking.customer_id)
    .maybeSingle() : { data: null };

  const globalMatches = customer
    ? await checkGlobalBlacklist(customer.id_number, customer.driver_license_number)
    : [];

  // Check if invoice already exists for this booking
  const { data: existingInvoice } = await db
    .from("invoices")
    .select("id, invoice_number, status")
    .eq("booking_id", bookingId)
    .maybeSingle();

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href={`/app/rentals/${companyId}`} className="text-sm text-neutral-500 hover:text-neutral-700">← Rentals</Link>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">Edit booking</h1>
        </div>
        <div className="flex items-center gap-2">
          {existingInvoice ? (
            <Link
              href={`/app/invoices/${companyId}/${existingInvoice.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              📄 {existingInvoice.invoice_number}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                existingInvoice.status === "paid"
                  ? "bg-green-50 text-green-700"
                  : existingInvoice.status === "sent"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-neutral-100 text-neutral-600"
              }`}>{existingInvoice.status}</span>
            </Link>
          ) : (
            <Link
              href={`/app/invoices/${companyId}/new?bookingId=${bookingId}`}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              + Create invoice
            </Link>
          )}
        </div>
      </div>
      {/* Global blacklist warning */}
      {globalMatches.length > 0 && customer && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-900 mb-2">
            ⚠ {customer.full_name} is flagged on the CarRentDesk global blacklist
          </p>
          <div className="space-y-1.5">
            {globalMatches.map((m) => {
              const sev = SEVERITY_LABELS[m.severity as 1|2|3];
              return (
                <div key={m.id} className="flex items-center gap-2 text-sm text-orange-800">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${sev.cls}`}>
                    {sev.label}
                  </span>
                  <span>{REASON_LABELS[m.reason_category] ?? m.reason_category}{m.country ? ` · ${m.country}` : ""}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-orange-600">
            Reported by {globalMatches.length} other {globalMatches.length === 1 ? "company" : "companies"} in the network.
            <a href={`/app/customers/${companyId}/${customer.id}`} className="ml-1 underline">View customer →</a>
          </p>
        </div>
      )}

      <BookingForm
        companyId={companyId}
        vehicles={vehicles ?? []}
        booking={booking}
        initialCustomer={customer ?? undefined}
        locationPresets={locationPresets}
      />
    </div>
  );
}
