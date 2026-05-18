import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BookingForm } from "../_components/booking-form";

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

  const [{ data: booking }, { data: vehicles }] = await Promise.all([
    db.from("bookings").select("*").eq("id", bookingId).eq("company_id", companyId).maybeSingle(),
    db.from("vehicles").select("id, make, model, year, plate").eq("company_id", companyId).neq("status", "retired").order("make").order("model"),
  ]);
  if (!booking) notFound();

  const { data: customer } = await db
    .from("customers")
    .select("id, full_name, phone, blacklisted, blacklist_reason")
    .eq("id", booking.customer_id)
    .maybeSingle();

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <Link href={`/app/rentals/${companyId}`} className="text-sm text-neutral-500 hover:text-neutral-700">← Rentals</Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">Edit booking</h1>
      </div>
      <BookingForm
        companyId={companyId}
        vehicles={vehicles ?? []}
        booking={booking}
        initialCustomer={customer ?? undefined}
      />
    </div>
  );
}
