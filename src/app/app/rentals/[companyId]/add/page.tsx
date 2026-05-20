import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BookingForm } from "../_components/booking-form";

export const metadata: Metadata = { title: "New Booking" };

export default async function AddBookingPage({
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

  const [{ data: vehicles }, { data: locs }] = await Promise.all([
    db.from("vehicles").select("id, make, model, year, plate").eq("company_id", companyId).neq("status", "retired").order("make").order("model"),
    db.from("locations").select("address").eq("company_id", companyId).order("created_at"),
  ]);
  const locationPresets = (locs ?? []).map((l) => l.address);

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="px-8 py-8">
        <Link href={`/app/rentals/${companyId}`} className="text-sm text-neutral-500 hover:text-neutral-700">← Rentals</Link>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No vehicles in your fleet yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Add a vehicle before creating a booking.</p>
          <Link href={`/app/fleet/${companyId}/add`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            + Add vehicle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <Link href={`/app/rentals/${companyId}`} className="text-sm text-neutral-500 hover:text-neutral-700">← Rentals</Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">New booking</h1>
      </div>
      <BookingForm companyId={companyId} vehicles={vehicles} locationPresets={locationPresets} />
    </div>
  );
}
