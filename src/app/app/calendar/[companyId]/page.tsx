import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CalendarGrid } from "./_components/calendar-grid";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({
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

  const { data: company } = await db
    .from("companies").select("id, name")
    .eq("id", companyId).maybeSingle();
  if (!company) notFound();

  // Fetch location presets
  const { data: locs } = await db
    .from("locations")
    .select("address")
    .eq("company_id", companyId)
    .order("created_at");
  const locationPresets = (locs ?? []).map((l) => l.address);

  // Fetch vehicles including inspection/insurance dates for calendar markers
  const { data: rawVehicles } = await db
    .from("vehicles")
    .select("id, make, model, plate, status, gov_inspection_next, service_next, insurance_valid_until")
    .eq("company_id", companyId)
    .neq("status", "retired")
    .order("make").order("model");

  const vehicles = (rawVehicles ?? []).map((v) => ({
    id:                   v.id,
    make:                 v.make,
    model:                v.model,
    plate:                v.plate,
    status:               v.status,
    gov_inspection_next:  v.gov_inspection_next ?? null,
    service_next:         v.service_next ?? null,
    insurance_valid_until: v.insurance_valid_until ?? null,
  }));

  // 60 days back, 365 days forward
  const now   = new Date();
  const start = new Date(now.getTime() - 60  * 24 * 60 * 60 * 1000).toISOString();
  const end   = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rawBookings } = await db
    .from("bookings")
    .select("id, vehicle_id, status, start_at, end_at, is_maintenance, insurance, child_seat_infant, child_seat_toddler, child_seat_child, booking_price, deposit_amount, deposit_paid, payment_method, pickup_location, return_location, notes, customers(id, full_name, phone)")
    .eq("company_id", companyId)
    .neq("status", "cancelled")
    .gte("end_at", start)
    .lte("start_at", end);

  const bookings = (rawBookings ?? []).map((b) => ({
    id:                 b.id,
    vehicle_id:         b.vehicle_id,
    status:             b.status,
    is_maintenance:     b.is_maintenance ?? false,
    start_at:           b.start_at,
    end_at:             b.end_at,
    insurance:          b.insurance,
    child_seat_infant:  b.child_seat_infant,
    child_seat_toddler: b.child_seat_toddler,
    child_seat_child:   b.child_seat_child,
    booking_price:      b.booking_price,
    deposit_amount:     b.deposit_amount,
    deposit_paid:       b.deposit_paid,
    payment_method:     b.payment_method,
    pickup_location:    b.pickup_location,
    return_location:    b.return_location,
    notes:              b.notes,
    customer_name:  (b.customers as { id: string; full_name: string; phone: string } | null)?.full_name ?? null,
    customer_phone: (b.customers as { id: string; full_name: string; phone: string } | null)?.phone ?? null,
    customer_id:    (b.customers as { id: string; full_name: string; phone: string } | null)?.id ?? null,
  }));

  return (
    <div className="px-4 py-4 lg:px-8 lg:py-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-neutral-900 lg:text-2xl">Calendar</h1>
        <p className="mt-0.5 text-sm text-neutral-500">{company.name}</p>
      </div>

      <CalendarGrid
        companyId={companyId}
        vehicles={vehicles}
        bookings={bookings}
        locationPresets={locationPresets}
      />
    </div>
  );
}
