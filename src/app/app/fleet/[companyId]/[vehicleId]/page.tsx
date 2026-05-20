import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { VehicleForm } from "../_components/vehicle-form";
import type { OdometerReading } from "@/components/operator/odometer-hint";

export const metadata: Metadata = { title: "Edit car" };

const TYPE_LABELS: Record<string, string> = {
  oil_change:         "Oil change",
  tires:              "Tires",
  brakes:             "Brakes",
  gov_inspection_fee: "Gov. inspection fee",
  insurance_payment:  "Insurance payment",
  bodywork:           "Bodywork / paint",
  cleaning:           "Cleaning / detailing",
  other:              "Other",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ companyId: string; vehicleId: string }>;
}) {
  const { companyId, vehicleId } = await params;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members").select("role")
    .eq("user_id", user.id).eq("company_id", companyId).maybeSingle();
  if (!membership) notFound();

  const { data: vehicle } = await db
    .from("vehicles").select("*")
    .eq("id", vehicleId).eq("company_id", companyId).maybeSingle();
  if (!vehicle) notFound();

  const [{ data: maintLogs }, { data: lastOdoRow }] = await Promise.all([
    db.from("maintenance_logs")
      .select("id, date, type, description, cost, supplier, next_due_km, next_due_date, next_due_label, odometer_km")
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false })
      .limit(20),
    db.from("odometer_readings")
      .select("odometer_km, recorded_at, source")
      .eq("vehicle_id", vehicleId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const lastOdoReading: OdometerReading | undefined = lastOdoRow
    ? { km: lastOdoRow.odometer_km, date: lastOdoRow.recorded_at, source: lastOdoRow.source }
    : undefined;

  const totalMaintCost = (maintLogs ?? []).reduce((s, l) => s + Number(l.cost), 0);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <a href={`/app/fleet/${companyId}`}
          className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline">
          ← Cars
        </a>
        <h1 className="mt-3 text-2xl font-bold text-neutral-900">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="mt-1 font-mono text-sm text-neutral-500">{vehicle.plate}</p>
      </div>
      <VehicleForm companyId={companyId} vehicle={vehicle} lastOdoReading={lastOdoReading} />

      {/* Service history */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Service history</h2>
            {maintLogs && maintLogs.length > 0 && (
              <p className="text-sm text-neutral-400">Total cost: <span className="font-semibold text-neutral-700">€{totalMaintCost.toFixed(2)}</span></p>
            )}
          </div>
          <Link
            href={`/app/maintenance/${companyId}/add?vehicle=${vehicleId}`}
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            + Add entry
          </Link>
        </div>

        {maintLogs && maintLogs.length > 0 ? (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-left text-xs">
                  <th className="px-4 py-2.5 font-medium text-neutral-500">Date</th>
                  <th className="px-4 py-2.5 font-medium text-neutral-500">Type</th>
                  <th className="px-4 py-2.5 font-medium text-neutral-500">Description</th>
                  <th className="px-4 py-2.5 font-medium text-neutral-500">Odometer</th>
                  <th className="px-4 py-2.5 font-medium text-neutral-500">Next due</th>
                  <th className="px-4 py-2.5 font-medium text-neutral-500 text-right">Cost</th>
                  <th className="px-4 py-2.5 font-medium text-neutral-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {maintLogs.map((l) => {
                  const hasReminder = l.next_due_km || l.next_due_date;
                  const today = new Date(); today.setHours(0,0,0,0);
                  const daysLeft = l.next_due_date
                    ? Math.ceil((new Date(l.next_due_date).getTime() - today.getTime()) / 86400000)
                    : null;
                  const kmLeft = l.next_due_km != null && vehicle.odometer_km != null
                    ? l.next_due_km - vehicle.odometer_km : null;
                  const isOverdue = (daysLeft != null && daysLeft < 0) || (kmLeft != null && kmLeft < 0);
                  const isSoon = !isOverdue && ((daysLeft != null && daysLeft <= 30) || (kmLeft != null && kmLeft <= 2000));
                  return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{fmtDate(l.date)}</td>
                    <td className="px-4 py-2.5 text-neutral-700">{TYPE_LABELS[l.type] ?? l.type}</td>
                    <td className="px-4 py-2.5 text-neutral-500 max-w-[120px] truncate">{l.description ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                      {l.odometer_km != null ? `${l.odometer_km.toLocaleString()} km` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {hasReminder ? (
                        <div className={isOverdue ? "text-red-600 font-semibold" : isSoon ? "text-amber-600 font-semibold" : "text-neutral-500"}>
                          {l.next_due_date && <div>{fmtDate(l.next_due_date)}{daysLeft != null && daysLeft < 0 ? " ⚠" : ""}</div>}
                          {l.next_due_km != null && <div>{l.next_due_km.toLocaleString()} km{kmLeft != null && kmLeft < 0 ? " ⚠" : ""}</div>}
                        </div>
                      ) : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-neutral-900">€{Number(l.cost).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/app/maintenance/${companyId}/${l.id}`}
                        className="text-xs text-brand-700 hover:underline">Edit</Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-white px-6 py-8 text-center">
            <p className="text-sm text-neutral-400">No service entries for this car yet.</p>
            <Link href={`/app/maintenance/${companyId}/add?vehicle=${vehicleId}`}
              className="mt-3 inline-block text-sm text-brand-700 hover:underline">
              Add first entry →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
