import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

const cityLabel: Record<string, string> = {
  riga: "Riga", tallinn: "Tallinn", vilnius: "Vilnius",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function isSameDay(iso: string, date: Date) {
  const d = new Date(iso);
  return d.getFullYear() === date.getFullYear()
    && d.getMonth() === date.getMonth()
    && d.getDate() === date.getDate();
}

function isThisMonth(iso: string | null, refDate: Date) {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth();
}

type BookingFull = {
  id: string;
  company_id: string;
  status: string;
  start_at: string;
  end_at: string;
  vehicles: { id: string; make: string; model: string; plate: string } | null;
  customers: { id: string; full_name: string; phone: string } | null;
};

type VehicleAlert = {
  id: string;
  company_id: string;
  make: string;
  model: string;
  plate: string;
  insurance_valid_until: string | null;
  gov_inspection_next: string | null;
  service_next: string | null;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const { claimed } = await searchParams;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: memberships } = await db
    .from("company_members")
    .select("role, company:companies(id, name, slug, status, city)")
    .eq("user_id", user.id);

  const companies = (memberships ?? []).map((m) => ({
    ...(m.company as { id: string; name: string; slug: string; status: string; city: string }),
    role: m.role,
  }));

  const companyIds = companies.map((c) => c.id);

  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const nowIso   = now.toISOString();

  // Vehicles (status + alert fields)
  const { data: vehicleRows } = companyIds.length
    ? await db.from("vehicles")
        .select("id, company_id, make, model, plate, status, insurance_valid_until, gov_inspection_next, service_next")
        .in("company_id", companyIds)
    : { data: [] };

  // Bookings for today, tomorrow and currently active
  const windowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const { data: bookingRows } = companyIds.length
    ? await db.from("bookings")
        .select("id, company_id, status, start_at, end_at, vehicles(id, make, model, plate), customers(id, full_name, phone)")
        .in("company_id", companyIds)
        .in("status", ["confirmed", "active"])
        .lte("start_at", windowEnd)
    : { data: [] };

  // Customer counts
  const { data: customerCounts } = companyIds.length
    ? await db.from("customers").select("company_id").in("company_id", companyIds)
    : { data: [] };

  const allBookings = (bookingRows ?? []) as BookingFull[];
  const allVehicles = (vehicleRows ?? []) as (VehicleAlert & { status: string })[];

  return (
    <div className="px-8 py-8">
      {/* Welcome banner */}
      {claimed === "1" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-emerald-800">Welcome to CarRentDesk!</p>
            <p className="text-sm text-emerald-700">Your account is set up. Use the navigation on the left to manage your operations.</p>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{greeting()}</h1>
        <p className="mt-1 text-sm text-neutral-400">{todayLabel()}</p>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No companies linked to your account yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Contact us at{" "}
            <a href="mailto:info@carrentdesk.com" className="text-brand-700 underline-offset-2 hover:underline">
              info@carrentdesk.com
            </a>{" "}
            to get set up.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {companies.map((company) => {
            const vehicles  = allVehicles.filter((v) => v.company_id === company.id);
            const bookings  = allBookings.filter((b) => b.company_id === company.id);
            const customers = (customerCounts ?? []).filter((c) => c.company_id === company.id).length;

            const pickupsToday   = bookings.filter((b) => isSameDay(b.start_at, today));
            const returnsToday   = bookings.filter((b) => isSameDay(b.end_at,   today));
            const pickupsTomorrow = bookings.filter((b) => isSameDay(b.start_at, tomorrow));
            const returnsTomorrow = bookings.filter((b) => isSameDay(b.end_at,   tomorrow));
            const currentlyOut   = bookings.filter((b) =>
              new Date(b.start_at) <= now && new Date(b.end_at) > now && !isSameDay(b.end_at, today)
            );

            // Alerts — this month
            const insuranceExpiring  = vehicles.filter((v) => isThisMonth(v.insurance_valid_until, now));
            const govInspectionDue   = vehicles.filter((v) => isThisMonth(v.gov_inspection_next,   now));
            const serviceDue         = vehicles.filter((v) => isThisMonth(v.service_next,          now));
            const hasAlerts = insuranceExpiring.length > 0 || govInspectionDue.length > 0 || serviceDue.length > 0;

            const total       = vehicles.length;
            const available   = vehicles.filter((v) => v.status === "available").length;
            const rented      = vehicles.filter((v) => v.status === "rented").length;
            const maintenance = vehicles.filter((v) => v.status === "maintenance").length;

            return (
              <div key={company.id}>
                {/* Company header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-neutral-900">{company.name}</h2>
                    {company.status === "verified" && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
                    )}
                    {company.status === "claimed" && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Claimed</span>
                    )}
                    <span className="text-sm text-neutral-400">{cityLabel[company.city] ?? company.city}</span>
                  </div>
                  <a href={`/c/${company.slug}`} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline">
                    View public listing →
                  </a>
                </div>

                <div className="space-y-4">

                  {/* ── Today ── */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <DayCard
                      title="Pickups today"
                      count={pickupsToday.length}
                      color="emerald"
                      emptyText="No pickups today"
                      companyId={company.id}
                    >
                      {pickupsToday.sort((a, b) => a.start_at.localeCompare(b.start_at)).map((b) => (
                        <BookingRow key={b.id} booking={b} timeField="start_at" companyId={company.id} />
                      ))}
                    </DayCard>

                    <DayCard
                      title="Returns today"
                      count={returnsToday.length}
                      color="blue"
                      emptyText="No returns today"
                      companyId={company.id}
                    >
                      {returnsToday.sort((a, b) => a.end_at.localeCompare(b.end_at)).map((b) => (
                        <BookingRow key={b.id} booking={b} timeField="end_at" companyId={company.id} />
                      ))}
                    </DayCard>
                  </div>

                  {/* ── Tomorrow ── */}
                  {(pickupsTomorrow.length > 0 || returnsTomorrow.length > 0) && (
                    <div className="rounded-2xl border border-border bg-white p-5">
                      <p className="mb-3 text-sm font-semibold text-neutral-500">
                        Tomorrow — get ready ({pickupsTomorrow.length + returnsTomorrow.length})
                      </p>
                      <div className="divide-y divide-border">
                        {[
                          ...pickupsTomorrow.map((b) => ({ ...b, type: "Pickup" as const })),
                          ...returnsTomorrow.map((b) => ({ ...b, type: "Return" as const })),
                        ]
                          .sort((a, b) => {
                            const ta = a.type === "Pickup" ? a.start_at : a.end_at;
                            const tb = b.type === "Pickup" ? b.start_at : b.end_at;
                            return ta.localeCompare(tb);
                          })
                          .map((b) => {
                            const time = b.type === "Pickup" ? formatTime(b.start_at) : formatTime(b.end_at);
                            return (
                              <Link key={`${b.type}-${b.id}`} href={`/app/rentals/${company.id}/${b.id}`}
                                className="flex items-center gap-4 py-2.5 hover:opacity-75">
                                <span className="w-12 shrink-0 font-mono text-sm font-medium text-neutral-700">{time}</span>
                                <span className={`w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium ${b.type === "Pickup" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                                  {b.type}
                                </span>
                                <span className="flex-1 text-sm text-neutral-900">{b.customers?.full_name ?? "—"}</span>
                                <span className="text-sm text-neutral-500">
                                  {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : "—"}
                                </span>
                                <span className="font-mono text-xs text-neutral-400">{b.vehicles?.plate ?? ""}</span>
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* ── Currently out ── */}
                  {currentlyOut.length > 0 && (
                    <div className="rounded-2xl border border-border bg-white p-5">
                      <p className="mb-3 text-sm font-semibold text-neutral-500">Currently out ({currentlyOut.length})</p>
                      <div className="divide-y divide-border">
                        {currentlyOut.sort((a, b) => a.end_at.localeCompare(b.end_at)).map((b) => (
                          <Link key={b.id} href={`/app/rentals/${company.id}/${b.id}`}
                            className="flex items-center gap-4 py-2.5 hover:opacity-75">
                            <span className="flex-1 text-sm font-medium text-neutral-900">
                              {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : "—"}
                            </span>
                            <span className="font-mono text-xs text-neutral-400">{b.vehicles?.plate ?? ""}</span>
                            <span className="text-sm text-neutral-500">{b.customers?.full_name ?? "—"}</span>
                            <span className="text-xs text-neutral-400">returns {formatDate(b.end_at)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Alerts this month ── */}
                  {hasAlerts && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <p className="mb-4 text-sm font-semibold text-amber-800">Attention needed this month</p>
                      <div className="space-y-4">
                        {insuranceExpiring.length > 0 && (
                          <AlertGroup
                            icon="🔴"
                            label={`Insurance expiring (${insuranceExpiring.length})`}
                            items={insuranceExpiring.map((v) => ({
                              name: `${v.make} ${v.model}`,
                              plate: v.plate,
                              date: v.insurance_valid_until!,
                              href: `/app/fleet/${company.id}/${v.id}`,
                            }))}
                          />
                        )}
                        {govInspectionDue.length > 0 && (
                          <AlertGroup
                            icon="🟡"
                            label={`Gov. inspection due (${govInspectionDue.length})`}
                            items={govInspectionDue.map((v) => ({
                              name: `${v.make} ${v.model}`,
                              plate: v.plate,
                              date: v.gov_inspection_next!,
                              href: `/app/fleet/${company.id}/${v.id}`,
                            }))}
                          />
                        )}
                        {serviceDue.length > 0 && (
                          <AlertGroup
                            icon="🟡"
                            label={`Service due (${serviceDue.length})`}
                            items={serviceDue.map((v) => ({
                              name: `${v.make} ${v.model}`,
                              plate: v.plate,
                              date: v.service_next!,
                              href: `/app/fleet/${company.id}/${v.id}`,
                            }))}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Fleet snapshot ── */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <MiniStat label="Total vehicles"   value={total}       href={`/app/fleet/${company.id}`} />
                    <MiniStat label="Available"        value={available}   href={`/app/fleet/${company.id}`} color="text-emerald-700" />
                    <MiniStat label="Out on rental"    value={rented}      href={`/app/rentals/${company.id}`} color="text-blue-700" />
                    <MiniStat label="Maintenance"      value={maintenance} href={`/app/fleet/${company.id}`} color={maintenance > 0 ? "text-amber-700" : undefined} />
                    <MiniStat label="Customers"        value={customers}   href={`/app/customers/${company.id}`} />
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DayCard({
  title, count, color, emptyText, children, companyId: _,
}: {
  title: string; count: number; color: "emerald" | "blue";
  emptyText: string; children: React.ReactNode; companyId: string;
}) {
  const accent = color === "emerald"
    ? "border-emerald-200 bg-emerald-50"
    : "border-blue-200 bg-blue-50";
  const badge  = color === "emerald"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-blue-100 text-blue-700";

  return (
    <div className={`rounded-2xl border p-5 ${count > 0 ? accent : "border-border bg-white"}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-700">{title}</p>
        {count > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{count}</span>
        )}
      </div>
      {count === 0 ? (
        <p className="text-sm text-neutral-400">{emptyText}</p>
      ) : (
        <div className="divide-y divide-black/5">{children}</div>
      )}
    </div>
  );
}

function BookingRow({
  booking, timeField, companyId,
}: {
  booking: BookingFull; timeField: "start_at" | "end_at"; companyId: string;
}) {
  const time = formatTime(booking[timeField]);
  return (
    <Link href={`/app/rentals/${companyId}/${booking.id}`}
      className="flex items-center gap-3 py-2.5 hover:opacity-75">
      <span className="w-12 shrink-0 font-mono text-sm font-bold text-neutral-800">{time}</span>
      <span className="flex-1 text-sm font-medium text-neutral-900">{booking.customers?.full_name ?? "—"}</span>
      <span className="text-sm text-neutral-600">
        {booking.vehicles ? `${booking.vehicles.make} ${booking.vehicles.model}` : "—"}
      </span>
      <span className="font-mono text-xs text-neutral-400">{booking.vehicles?.plate ?? ""}</span>
    </Link>
  );
}

function AlertGroup({
  icon, label, items,
}: {
  icon: string;
  label: string;
  items: { name: string; plate: string; date: string; href: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-amber-900">
        {icon} {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 text-sm hover:opacity-75">
            <span className="flex-1 text-amber-900">{item.name}</span>
            <span className="font-mono text-xs text-amber-700">{item.plate}</span>
            <span className="text-xs text-amber-700">expires {formatDate(item.date)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniStat({
  label, value, href, color,
}: {
  label: string; value: number; href: string; color?: string;
}) {
  return (
    <a href={href} className="rounded-xl border border-border bg-white px-4 py-3 hover:bg-slate-50">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${color ?? "text-neutral-900"}`}>{value}</p>
    </a>
  );
}
