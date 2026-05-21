import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { RenewAction } from "./_components/renew-action";

export const metadata: Metadata = { title: "Today" };

function todayUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function tomorrowUTC() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function in7DaysUTC() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function endOfMonthUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate()).padStart(2, "0")}`;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

const TODAY_LABEL = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default async function TodayPage({ params }: { params: Promise<{ companyId: string }> }) {
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

  const today = todayUTC();
  const tomorrow = tomorrowUTC();
  const in7Days = in7DaysUTC();
  const endOfMonth = endOfMonthUTC();

  // Fetch all active/confirmed bookings with customer + vehicle info
  const { data: allBookings } = await db
    .from("bookings")
    .select("id, start_at, end_at, status, is_longterm, renewal_period_days, booking_price, pickup_location, return_location, notes, customers(full_name, phone), vehicles(make, model, plate)")
    .eq("company_id", companyId)
    .neq("status", "cancelled")
    .neq("status", "returned");

  const bookings = (allBookings ?? []) as unknown as Array<{
    id: string;
    start_at: string;
    end_at: string;
    status: string;
    is_longterm: boolean;
    renewal_period_days: number | null;
    booking_price: number | null;
    pickup_location: string | null;
    return_location: string | null;
    notes: string | null;
    customers: { full_name: string; phone: string } | null;
    vehicles: { make: string; model: string; plate: string } | null;
  }>;

  // ── Pickups today
  const pickupsToday = bookings.filter((b) => b.start_at.slice(0, 10) === today)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));

  // ── Returns today (non-longterm)
  const returnsToday = bookings.filter((b) => b.end_at.slice(0, 10) === today && !b.is_longterm)
    .sort((a, b) => a.end_at.localeCompare(b.end_at));

  // ── Pickups tomorrow
  const pickupsTomorrow = bookings.filter((b) => b.start_at.slice(0, 10) === tomorrow)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));

  // ── Returns tomorrow (non-longterm)
  const returnsTomorrow = bookings.filter((b) => b.end_at.slice(0, 10) === tomorrow && !b.is_longterm)
    .sort((a, b) => a.end_at.localeCompare(b.end_at));

  // ── Renewals due within 7 days (and not overdue)
  const renewalsDue = bookings.filter((b) =>
    b.is_longterm && b.status === "active" &&
    b.end_at.slice(0, 10) >= today && b.end_at.slice(0, 10) <= in7Days
  ).sort((a, b) => a.end_at.localeCompare(b.end_at));

  // ── Overdue renewals (end_at passed, still active, longterm)
  const renewalsOverdue = bookings.filter((b) =>
    b.is_longterm && b.status === "active" && b.end_at.slice(0, 10) < today
  ).sort((a, b) => a.end_at.localeCompare(b.end_at));

  // ── Maintenance due this month (vehicles with gov_inspection_next or insurance_valid_until this month)
  const { data: vehiclesRaw } = await db
    .from("vehicles")
    .select("id, make, model, plate, gov_inspection_next, insurance_valid_until")
    .eq("company_id", companyId)
    .neq("status", "retired");

  const vehicles = vehiclesRaw ?? [];
  const maintenanceDue = vehicles.filter((v) =>
    (v.gov_inspection_next && v.gov_inspection_next.slice(0, 10) >= today && v.gov_inspection_next.slice(0, 10) <= endOfMonth) ||
    (v.insurance_valid_until && v.insurance_valid_until.slice(0, 10) >= today && v.insurance_valid_until.slice(0, 10) <= endOfMonth)
  );

  const hasAnything = pickupsToday.length + returnsToday.length + renewalsDue.length + renewalsOverdue.length > 0;

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Today</h1>
        <p className="mt-0.5 text-sm text-neutral-500">{TODAY_LABEL} · {company.name}</p>
      </div>

      {!hasAnything && pickupsTomorrow.length === 0 && returnsTomorrow.length === 0 && (
        <div className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-neutral-400">
          Nothing scheduled for today or tomorrow. Enjoy the quiet! 🎉
        </div>
      )}

      {/* ── Overdue renewals (most urgent) */}
      {renewalsOverdue.length > 0 && (
        <Section title="⚠ Overdue renewals" color="red">
          {renewalsOverdue.map((b) => (
            <RenewalCard key={b.id} b={b} companyId={companyId} isOverdue />
          ))}
        </Section>
      )}

      {/* ── Pickups today */}
      {pickupsToday.length > 0 && (
        <Section title={`🚗 Pickups today (${pickupsToday.length})`} color="amber">
          {pickupsToday.map((b) => (
            <BookingCard key={b.id} b={b} companyId={companyId} timeField="start_at" label="Pickup" />
          ))}
        </Section>
      )}

      {/* ── Returns today */}
      {returnsToday.length > 0 && (
        <Section title={`🔑 Returns today (${returnsToday.length})`} color="emerald">
          {returnsToday.map((b) => (
            <BookingCard key={b.id} b={b} companyId={companyId} timeField="end_at" label="Return" />
          ))}
        </Section>
      )}

      {/* ── Renewals due this week */}
      {renewalsDue.length > 0 && (
        <Section title={`↻ Renewals due — next 7 days (${renewalsDue.length})`} color="brand">
          {renewalsDue.map((b) => (
            <RenewalCard key={b.id} b={b} companyId={companyId} />
          ))}
        </Section>
      )}

      {/* ── Tomorrow preview */}
      {(pickupsTomorrow.length > 0 || returnsTomorrow.length > 0) && (
        <Section title="📅 Tomorrow" color="slate">
          {pickupsTomorrow.map((b) => (
            <BookingCard key={b.id} b={b} companyId={companyId} timeField="start_at" label="Pickup" dim />
          ))}
          {returnsTomorrow.map((b) => (
            <BookingCard key={b.id} b={b} companyId={companyId} timeField="end_at" label="Return" dim />
          ))}
        </Section>
      )}

      {/* ── Maintenance due this month */}
      {maintenanceDue.length > 0 && (
        <Section title="🔧 Maintenance / docs due this month" color="slate">
          {maintenanceDue.map((v) => (
            <div key={v.id} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{v.make} {v.model} · {v.plate}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-500">
                  {v.gov_inspection_next && <span>Gov. inspection: <span className="font-medium text-yellow-700">{fmtDate(v.gov_inspection_next)}</span></span>}
                  {v.insurance_valid_until && <span>Insurance: <span className="font-medium text-emerald-700">{fmtDate(v.insurance_valid_until)}</span></span>}
                </div>
              </div>
              <Link href={`/app/fleet/${companyId}/${v.id}`} className="shrink-0 text-xs text-brand-700 hover:underline">Edit car</Link>
            </div>
          ))}
        </Section>
      )}

    </div>
  );
}

function Section({ title, children, color }: { title: string; children: React.ReactNode; color: string }) {
  const border = color === "red" ? "border-red-200 bg-red-50" :
                 color === "amber" ? "border-amber-200 bg-amber-50" :
                 color === "emerald" ? "border-emerald-200 bg-emerald-50" :
                 color === "brand" ? "border-brand-200 bg-brand-50" :
                 "border-border bg-slate-50";
  const heading = color === "red" ? "text-red-800" :
                  color === "amber" ? "text-amber-800" :
                  color === "emerald" ? "text-emerald-800" :
                  color === "brand" ? "text-brand-800" :
                  "text-neutral-700";
  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${border}`}>
      <h2 className={`text-sm font-semibold ${heading}`}>{title}</h2>
      {children}
    </div>
  );
}

function BookingCard({ b, companyId, timeField, label, dim = false }: {
  b: { id: string; start_at: string; end_at: string; pickup_location: string | null; return_location: string | null; booking_price: number | null; customers: { full_name: string; phone: string } | null; vehicles: { make: string; model: string; plate: string } | null };
  companyId: string; timeField: "start_at" | "end_at"; label: string; dim?: boolean;
}) {
  const time = fmtTime(b[timeField]);
  const location = timeField === "start_at" ? b.pickup_location : b.return_location;
  return (
    <div className={`flex items-start justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3 ${dim ? "opacity-70" : ""}`}>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-neutral-900">{time}</span>
          <span className="text-xs text-neutral-400">{label}</span>
        </div>
        <p className="mt-0.5 text-sm font-semibold text-neutral-900">{b.customers?.full_name ?? "—"}</p>
        <p className="text-xs text-neutral-500">{b.vehicles?.make} {b.vehicles?.model} · {b.vehicles?.plate}</p>
        {location && <p className="mt-1 text-xs text-neutral-400">📍 {location}</p>}
        {b.booking_price != null && <p className="text-xs text-neutral-400">€{b.booking_price.toFixed(2)}</p>}
      </div>
      <Link href={`/app/rentals/${companyId}/${b.id}`} className="shrink-0 text-xs text-brand-700 hover:underline">View</Link>
    </div>
  );
}

function RenewalCard({ b, companyId, isOverdue = false }: {
  b: { id: string; end_at: string; is_longterm: boolean; renewal_period_days: number | null; booking_price: number | null; customers: { full_name: string; phone: string } | null; vehicles: { make: string; model: string; plate: string } | null };
  companyId: string; isOverdue?: boolean;
}) {
  const today = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}-${String(new Date().getUTCDate()).padStart(2, "0")}`;
  const daysAgo = daysBetween(b.end_at, new Date().toISOString());
  const daysUntil = daysBetween(new Date().toISOString(), b.end_at);
  return (
    <div className={`rounded-xl border bg-white px-4 py-3 ${isOverdue ? "border-red-300" : "border-border"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{b.customers?.full_name ?? "—"}</p>
          <p className="text-xs text-neutral-500">{b.vehicles?.make} {b.vehicles?.model} · {b.vehicles?.plate}</p>
          <p className={`mt-1 text-xs font-medium ${isOverdue ? "text-red-600" : "text-amber-700"}`}>
            {isOverdue
              ? `Overdue by ${daysAgo} day${daysAgo !== 1 ? "s" : ""} — renewal was due ${fmtDate(b.end_at)}`
              : b.end_at.slice(0, 10) === today
                ? "Due today"
                : `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} · ${fmtDate(b.end_at)}`
            }
          </p>
        </div>
        <Link href={`/app/rentals/${companyId}/${b.id}`} className="shrink-0 text-xs text-brand-700 hover:underline">View</Link>
      </div>
      <RenewAction
        bookingId={b.id}
        customerName={b.customers?.full_name ?? "—"}
        plate={b.vehicles?.plate ?? "—"}
        currentEndAt={b.end_at}
        renewalPeriodDays={b.renewal_period_days ?? 30}
        pricePerPeriod={b.booking_price}
      />
    </div>
  );
}
