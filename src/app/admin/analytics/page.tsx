import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCityBySlug } from "@/lib/cities";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

type Row = {
  city_slug: string;
  pickup_date: string | null;
  return_date: string | null;
  pickup_time: string | null;
  return_time: string | null;
  place_label: string | null;
  updated_at: string;
};

export default async function AdminAnalyticsPage() {
  const db = createServiceRoleClient();
  const { data } = await db
    .from("search_demand")
    .select("city_slug, pickup_date, return_date, pickup_time, return_time, place_label, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as Row[];
  const byCity = new Map<string, { searches: number; places: Map<string, number> }>();
  for (const row of rows) {
    const entry = byCity.get(row.city_slug) ?? { searches: 0, places: new Map<string, number>() };
    entry.searches += 1;
    const place = row.place_label ?? "No place chosen";
    entry.places.set(place, (entry.places.get(place) ?? 0) + 1);
    byCity.set(row.city_slug, entry);
  }
  const cities = [...byCity.entries()].sort((a, b) => b[1].searches - a[1].searches);

  const { data: viewRows } = await db
    .from("listing_views")
    .select("company_slug, city_slug, views")
    .limit(5000);
  const byRental = new Map<string, { city: string | null; people: number; opens: number }>();
  for (const row of viewRows ?? []) {
    const entry = byRental.get(row.company_slug) ?? { city: row.city_slug, people: 0, opens: 0 };
    entry.people += 1;
    entry.opens += row.views;
    byRental.set(row.company_slug, entry);
  }
  const rentalSlugs = [...byRental.keys()];
  const { data: rentalNames } = rentalSlugs.length
    ? await db.from("companies").select("slug, name").in("slug", rentalSlugs)
    : { data: [] };
  const nameBySlug = new Map((rentalNames ?? []).map((company) => [company.slug, company.name]));
  const rentals = [...byRental.entries()].sort((a, b) => b[1].people - a[1].people || b[1].opens - a[1].opens);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">Search demand</h1>
      <p className="mt-1 text-sm text-neutral-500">
        One person per browser and city. Changing the dates updates the same search. A refresh does not add another person.
      </p>

      {cities.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No searches yet.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {cities.map(([slug, entry]) => (
            <div key={slug} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-neutral-900">{getCityBySlug(slug)?.name ?? slug}</h2>
                <p className="text-sm text-neutral-500">{entry.searches} {entry.searches === 1 ? "search" : "searches"}</p>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-neutral-700">
                {[...entry.places.entries()].sort((a, b) => b[1] - a[1]).map(([place, count]) => (
                  <li key={place} className="flex justify-between gap-3">
                    <span>{place}</span>
                    <span className="tabular-nums text-neutral-500">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold text-neutral-900">Rental pages</h2>
      <p className="mt-1 text-sm text-neutral-500">
        One person per browser and rental. Opening the page again counts as another look, not another person.
      </p>
      {rentals.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No rental pages opened yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Rental</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">People</th>
                <th className="px-4 py-3 font-medium">Opens</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map(([slug, entry]) => (
                <tr key={slug} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-neutral-900">{nameBySlug.get(slug) ?? slug}</td>
                  <td className="px-4 py-3">{entry.city ? (getCityBySlug(entry.city)?.name ?? entry.city) : "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{entry.people}</td>
                  <td className="px-4 py-3 tabular-nums">{entry.opens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Pickup</th>
                <th className="px-4 py-3 font-medium">Return</th>
                <th className="px-4 py-3 font-medium">Place</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((row, index) => (
                <tr key={`${row.city_slug}-${row.updated_at}-${index}`} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{getCityBySlug(row.city_slug)?.name ?? row.city_slug}</td>
                  <td className="px-4 py-3 tabular-nums">{row.pickup_date} {row.pickup_time}</td>
                  <td className="px-4 py-3 tabular-nums">{row.return_date} {row.return_time}</td>
                  <td className="px-4 py-3">{row.place_label ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
