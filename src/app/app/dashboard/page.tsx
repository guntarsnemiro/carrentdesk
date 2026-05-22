import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { LocalTime } from "./_components/local-time";

export const metadata: Metadata = { title: "Dashboard" };

const cityLabel: Record<string, string> = {
  riga: "Riga", tallinn: "Tallinn", vilnius: "Vilnius",
};

function greeting() {
  const h = new Date().getUTCHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
}

/** Returns today's date string "YYYY-MM-DD" in UTC */
function todayUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function tomorrowUTC() {
  const d = new Date(Date.now() + 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function in7DaysUTC() {
  const d = new Date(Date.now() + 7 * 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isThisMonth(iso: string | null, refDate: Date) {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getUTCFullYear() === refDate.getUTCFullYear() && d.getUTCMonth() === refDate.getUTCMonth();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

type BookingFull = {
  id: string;
  company_id: string;
  status: string;
  start_at: string;
  end_at: string;
  is_longterm: boolean;
  renewal_period_days: number | null;
  deposit_amount: number | null;
  deposit_returned_at: string | null;
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

  const now = new Date();
  const today = todayUTC();
  const tomorrow = tomorrowUTC();
  const in7Days = in7DaysUTC();

  // Vehicles
  const { data: vehicleRows } = companyIds.length
    ? await db.from("vehicles")
        .select("id, company_id, make, model, plate, status, insurance_valid_until, gov_inspection_next, service_next")
        .in("company_id", companyIds)
    : { data: [] };

  // All non-cancelled, non-returned bookings (broad — Today page approach)
  const { data: bookingRows } = companyIds.length
    ? await db.from("bookings")
        .select("id, company_id, status, start_at, end_at, is_longterm, renewal_period_days, deposit_amount, deposit_returned_at, vehicles(id, make, model, plate), customers(id, full_name, phone)")
        .in("company_id", companyIds)
        .neq("status", "cancelled")
        .neq("status", "returned")
    : { data: [] };

  // Customer counts
  const { data: customerCounts } = companyIds.length
    ? await db.from("customers").select("company_id").in("company_id", companyIds)
    : { data: [] };

  // Maintenance reminders
  const { data: maintLogsRaw } = companyIds.length
    ? await db.from("maintenance_logs")
        .select("id, company_id, vehicle_id, type, next_due_km, next_due_date, next_due_label, odometer_km, date, vehicle:vehicles(make, model, plate, odometer_km)")
        .in("company_id", companyIds)
        .or("next_due_km.not.is.null,next_due_date.not.is.null")
        .order("date", { ascending: false })
    : { data: [] };

  type MaintLog = { id: string; company_id: string; vehicle_id: string; type: string; next_due_km: number | null; next_due_date: string | null; next_due_label: string | null; odometer_km: number | null; date: string; vehicle: { make: string; model: string; plate: string; odometer_km: number | null } | null; };
  const latestMaintMap = new Map<string, MaintLog>();
  for (const l of (maintLogsRaw ?? []) as MaintLog[]) {
    const key = `${l.vehicle_id}::${l.type}`;
    const existing = latestMaintMap.get(key);
    if (!existing || l.date > existing.date) latestMaintMap.set(key, l);
  }

  const allBookings = (bookingRows ?? []) as BookingFull[];
  const allVehicles = (vehicleRows ?? []) as (VehicleAlert & { status: string })[];

  return (
    <div className="px-8 py-8">
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

            // Use UTC string slice for reliable date comparison (same as Today page)
            const pickupsToday    = bookings.filter((b) => b.start_at.slice(0, 10) === today)
              .sort((a, b) => a.start_at.localeCompare(b.start_at));
            const returnsToday    = bookings.filter((b) => b.end_at.slice(0, 10) === today && !b.is_longterm)
              .sort((a, b) => a.end_at.localeCompare(b.end_at));
            const pickupsTomorrow = bookings.filter((b) => b.start_at.slice(0, 10) === tomorrow)
              .sort((a, b) => a.start_at.localeCompare(b.start_at));
            const returnsTomorrow = bookings.filter((b) => b.end_at.slice(0, 10) === tomorrow && !b.is_longterm)
              .sort((a, b) => a.end_at.localeCompare(b.end_at));
            const currentlyOut    = bookings.filter((b) => b.start_at.slice(0, 10) < today && b.end_at.slice(0, 10) > today);

            // Long-term renewals due within 7 days
            const renewalsDue = bookings.filter((b) =>
              b.is_longterm && b.status === "active" &&
              b.end_at.slice(0, 10) >= today && b.end_at.slice(0, 10) <= in7Days
            ).sort((a, b) => a.end_at.localeCompare(b.end_at));

            const renewalsOverdue = bookings.filter((b) =>
              b.is_longterm && b.status === "active" && b.end_at.slice(0, 10) < today
            ).sort((a, b) => a.end_at.localeCompare(b.end_at));

            // Deposits outstanding (ended, not returned)
            const depositsOutstanding = bookings.filter((b) =>
              b.deposit_amount != null && b.deposit_amount > 0 &&
              b.deposit_returned_at == null &&
              b.end_at.slice(0, 10) <= today
            );

            // Alerts this month
            const insuranceExpiring  = vehicles.filter((v) => isThisMonth(v.insurance_valid_until, now));
            const govInspectionDue   = vehicles.filter((v) => isThisMonth(v.gov_inspection_next,   now));
            const serviceDue         = vehicles.filter((v) => isThisMonth(v.service_next,          now));

            type MaintReminder = { logId: string; vehicleName: string; plate: string; label: string; daysLeft: number | null; kmLeft: number | null; href: string };
            const maintReminders: MaintReminder[] = [];
            const todayMs = Date.now();
            for (const l of latestMaintMap.values()) {
              if (l.company_id !== company.id) continue;
              const v = l.vehicle as { make: string; model: string; plate: string; odometer_km: number | null } | null;
              if (!v) continue;
              const daysLeft = l.next_due_date
                ? Math.ceil((new Date(l.next_due_date).getTime() - todayMs) / 86400000)
                : null;
              const kmLeft = l.next_due_km != null && v.odometer_km != null ? l.next_due_km - v.odometer_km : null;
              const isOverdue = (daysLeft != null && daysLeft < 0) || (kmLeft != null && kmLeft < 0);
              const isSoon    = !isOverdue && ((daysLeft != null && daysLeft <= 30) || (kmLeft != null && kmLeft <= 2000));
              if (isOverdue || isSoon) {
                maintReminders.push({
                  logId: l.id, vehicleName: `${v.make} ${v.model}`, plate: v.plate,
                  label: l.next_due_label ?? l.type, daysLeft, kmLeft,
                  href: `/app/maintenance/${company.id}/${l.id}`,
                });
              }
            }
            maintReminders.sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));

            const hasAlerts = insuranceExpiring.length > 0 || govInspectionDue.length > 0 || serviceDue.length > 0 || maintReminders.length > 0;

            const total       = vehicles.length;
            const available   = vehicles.filter((v) => v.status === "available").length;
            const rented      = vehicles.filter((v) => v.status === "rented").length;
            const maintenance = vehicles.filter((v) => v.status === "maintenance").length;

            return (
              <div key={company.id}>
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
                </div>

                <div className="space-y-4">

                  {/* ── Overdue renewals — urgent banner ── */}
                  {renewalsOverdue.length > 0 && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
                      <p className="mb-2 text-sm font-semibold text-red-800">⚠ Overdue renewals ({renewalsOverdue.length})</p>
                      <div className="divide-y divide-red-100">
                        {renewalsOverdue.map((b) => {
                          const daysAgo = Math.round((Date.now() - new Date(b.end_at).getTime()) / 86_400_000);
                          return (
                            <Link key={b.id} href={`/app/rentals/${company.id}/${b.id}`}
                              className="flex items-center gap-4 py-2.5 hover:opacity-75">
                              <span className="flex-1 text-sm font-medium text-red-900">{b.customers?.full_name ?? "—"}</span>
                              <span className="text-sm text-red-700">{b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : "—"}</span>
                              <span className="font-mono text-xs text-red-600">{b.vehicles?.plate ?? ""}</span>
                              <span className="text-xs text-red-600">{daysAgo}d overdue</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Today: Pickups & Returns ── */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <DayCard title="Pickups today" count={pickupsToday.length} color="emerald" emptyText="No pickups today">
                      {pickupsToday.map((b) => (
                        <BookingRow key={b.id} booking={b} timeField="start_at" companyId={company.id} />
                      ))}
                    </DayCard>

                    <DayCard title="Returns today" count={returnsToday.length} color="blue" emptyText="No returns today">
                      {returnsToday.map((b) => (
                        <BookingRow key={b.id} booking={b} timeField="end_at" companyId={company.id} />
                      ))}
                    </DayCard>
                  </div>

                  {/* ── Renewals due this week ── */}
                  {renewalsDue.length > 0 && (
                    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
                      <p className="mb-3 text-sm font-semibold text-brand-800">↻ Renewals due — next 7 days ({renewalsDue.length})</p>
                      <div className="divide-y divide-brand-100">
                        {renewalsDue.map((b) => {
                          const daysLeft = Math.round((new Date(b.end_at).getTime() - Date.now()) / 86_400_000);
                          return (
                            <Link key={b.id} href={`/app/rentals/${company.id}/${b.id}`}
                              className="flex items-center gap-4 py-2.5 hover:opacity-75">
                              <span className="flex-1 text-sm font-medium text-neutral-900">{b.customers?.full_name ?? "—"}</span>
                              <span className="text-sm text-neutral-600">{b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : "—"}</span>
                              <span className="font-mono text-xs text-neutral-400">{b.vehicles?.plate ?? ""}</span>
                              <span className={`text-xs font-medium ${daysLeft === 0 ? "text-red-600" : daysLeft <= 2 ? "text-amber-600" : "text-brand-700"}`}>
                                {daysLeft === 0 ? "due today" : `${daysLeft}d left`}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Deposits to release ── */}
                  {depositsOutstanding.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <p className="mb-3 text-sm font-semibold text-amber-800">💰 Deposits to release ({depositsOutstanding.length})</p>
                      <div className="divide-y divide-amber-100">
                        {depositsOutstanding.map((b) => {
                          const daysAgo = Math.round((Date.now() - new Date(b.end_at).getTime()) / 86_400_000);
                          return (
                            <Link key={b.id} href={`/app/rentals/${company.id}/${b.id}`}
                              className="flex items-center gap-4 py-2.5 hover:opacity-75">
                              <span className="flex-1 text-sm font-medium text-neutral-900">{b.customers?.full_name ?? "—"}</span>
                              <span className="text-sm text-neutral-600">{b.vehicles ? `${b.vehicles.make} ${b.vehicles.model}` : "—"}</span>
                              <span className="font-mono text-xs text-neutral-400">{b.vehicles?.plate ?? ""}</span>
                              <span className="text-xs font-semibold text-amber-700">€{(b.deposit_amount ?? 0).toFixed(2)}</span>
                              <span className="text-xs text-amber-600">{daysAgo === 0 ? "returned today" : `${daysAgo}d ago`}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                            const iso = b.type === "Pickup" ? b.start_at : b.end_at;
                            return (
                              <Link key={`${b.type}-${b.id}`} href={`/app/rentals/${company.id}/${b.id}`}
                                className="flex items-center gap-4 py-2.5 hover:opacity-75">
                                <span className="w-12 shrink-0 font-mono text-sm font-medium text-neutral-700">
                                  <LocalTime iso={iso} />
                                </span>
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
                        {maintReminders.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-sm font-medium text-amber-900">🔧 Service reminders ({maintReminders.length})</p>
                            <div className="space-y-1">
                              {maintReminders.map((r) => (
                                <a key={r.logId} href={r.href} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm hover:opacity-75">
                                  <span className="font-medium text-amber-900">{r.vehicleName}</span>
                                  <span className="font-mono text-xs text-amber-700">{r.plate}</span>
                                  <span className="text-xs text-amber-700">{r.label}</span>
                                  {r.daysLeft != null && (
                                    <span className="text-xs text-amber-600">
                                      {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : r.daysLeft === 0 ? "due today" : `${r.daysLeft}d left`}
                                    </span>
                                  )}
                                  {r.kmLeft != null && (
                                    <span className="text-xs text-amber-600">
                                      {r.kmLeft < 0 ? `${Math.abs(r.kmLeft).toLocaleString()} km overdue` : `${r.kmLeft.toLocaleString()} km left`}
                                    </span>
                                  )}
                                </a>
                              ))}
                            </div>
                          </div>
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
  title, count, color, emptyText, children,
}: {
  title: string; count: number; color: "emerald" | "blue";
  emptyText: string; children: React.ReactNode;
}) {
  const accent = color === "emerald" ? "border-emerald-200 bg-emerald-50" : "border-blue-200 bg-blue-50";
  const badge  = color === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700";

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
  return (
    <Link href={`/app/rentals/${companyId}/${booking.id}`}
      className="flex items-center gap-3 py-2.5 hover:opacity-75">
      <span className="w-12 shrink-0 font-mono text-sm font-bold text-neutral-800">
        <LocalTime iso={booking[timeField]} />
      </span>
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
