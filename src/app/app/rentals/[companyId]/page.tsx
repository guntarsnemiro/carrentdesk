import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Rentals" };

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-amber-50 text-amber-700",
  active:    "bg-emerald-50 text-emerald-700",
  returned:  "bg-neutral-100 text-neutral-500",
  cancelled: "bg-red-50 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  active:    "Active",
  returned:  "Returned",
  cancelled: "Cancelled",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatPrice(n: number | null) {
  if (n == null) return "—";
  return `€${n.toFixed(2)}`;
}

type Booking = {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  booking_price: number | null;
  deposit_paid: boolean;
  vehicles: { make: string; model: string; year: number; plate: string } | null;
  customers: { full_name: string; phone: string; blacklisted: boolean } | null;
};

function groupBookings(bookings: Booking[]) {
  const now = new Date();
  const active:    Booking[] = [];
  const upcoming:  Booking[] = [];
  const past:      Booking[] = [];

  for (const b of bookings) {
    if (b.status === "cancelled") { past.push(b); continue; }
    if (b.status === "returned")  { past.push(b); continue; }
    const start = new Date(b.start_at);
    const end   = new Date(b.end_at);
    if (start <= now && end >= now) active.push(b);
    else if (start > now)           upcoming.push(b);
    else                            past.push(b);
  }

  active.sort((a, b)   => new Date(a.end_at).getTime()   - new Date(b.end_at).getTime());
  upcoming.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  past.sort((a, b)     => new Date(b.end_at).getTime()   - new Date(a.end_at).getTime());

  return { active, upcoming, past };
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

  const bookings = (rawBookings ?? []) as Booking[];
  const { active, upcoming, past } = groupBookings(bookings);

  const stats = {
    total:     bookings.length,
    active:    active.length,
    upcoming:  upcoming.length,
  };

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Rentals</h1>
          <p className="mt-1 text-sm text-neutral-500">{company.name}</p>
        </div>
        <Link href={`/app/rentals/${companyId}/add`}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          + New booking
        </Link>
      </div>

      {/* Stats */}
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
        <div className="space-y-8">
          <BookingGroup title="Active now" bookings={active} companyId={companyId} emptyText="No active rentals right now." />
          <BookingGroup title="Upcoming" bookings={upcoming} companyId={companyId} emptyText="No upcoming bookings." />
          <BookingGroup title="Past" bookings={past} companyId={companyId} emptyText="No past bookings." collapsed />
        </div>
      )}
    </div>
  );
}

function BookingGroup({
  title, bookings, companyId, emptyText, collapsed,
}: {
  title: string; bookings: Booking[]; companyId: string; emptyText: string; collapsed?: boolean;
}) {
  if (collapsed && bookings.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-neutral-400">{emptyText}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50 text-left text-xs">
                <th className="px-4 py-3 font-medium text-neutral-500">Customer</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Vehicle</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Pickup</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Return</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Price</th>
                <th className="px-4 py-3 font-medium text-neutral-500">Status</th>
                <th className="px-4 py-3 font-medium text-neutral-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-neutral-900">{b.customers?.full_name ?? "—"}</span>
                      {b.customers?.blacklisted && (
                        <span title="Blacklisted customer" className="text-red-500">⚠</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-400">{b.customers?.phone ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">
                      {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : "—"}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-neutral-400">{b.vehicles?.plate ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(b.start_at)}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(b.end_at)}</td>
                  <td className="px-4 py-3 text-neutral-700">{formatPrice(b.booking_price)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? ""}`}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/rentals/${companyId}/${b.id}`}
                      className="text-xs text-brand-700 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
