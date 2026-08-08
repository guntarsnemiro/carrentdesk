import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BookingsTable, type BookingRow } from "./_components/bookings-table";

export const metadata: Metadata = { title: "Rentals" };

function computeStats(bookings: BookingRow[]) {
  const now = new Date();
  let active = 0;
  let upcoming = 0;

  for (const b of bookings) {
    if (b.status === "cancelled" || b.status === "returned") continue;
    const start = new Date(b.start_at);
    const end = new Date(b.end_at);
    if (start <= now && end >= now) active += 1;
    else if (start > now) upcoming += 1;
  }

  return { total: bookings.length, active, upcoming };
}

export default async function RentalsPage({
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

  const { data: rawBookings } = await db
    .from("bookings")
    .select("id, status, start_at, end_at, booking_price, deposit_paid, vehicles(make, model, year, plate), customers(full_name, phone, blacklisted)")
    .eq("company_id", companyId)
    .order("start_at", { ascending: false });

  const bookings = (rawBookings ?? []) as BookingRow[];
  const stats = computeStats(bookings);

  return (
    <div className="min-w-0 px-3 py-6 lg:px-4 lg:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Rentals</h1>
          <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
        </div>
        <Link href={`/app/rentals/${companyId}/add`}
          className="shrink-0 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          + New booking
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Total",    value: stats.total,    color: "text-neutral-900" },
          { label: "Active",   value: stats.active,   color: "text-emerald-700" },
          { label: "Upcoming", value: stats.upcoming, color: "text-amber-700"   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-neutral-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No bookings yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Create your first rental booking to get started.</p>
          <Link href={`/app/rentals/${companyId}/add`}
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            + New booking
          </Link>
        </div>
      ) : (
        <BookingsTable bookings={bookings} companyId={companyId} />
      )}
    </div>
  );
}
