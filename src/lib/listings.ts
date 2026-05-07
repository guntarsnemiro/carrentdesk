/**
 * Listings data layer.
 *
 * Reads come from the live Supabase database via `createServerClient`.
 * The shape returned by these query helpers is the `Listing` type below,
 * which the marketplace UI components consume directly.
 *
 * The marketplace tables (`companies`, `company_amenities`,
 * `company_fleet_summary`, `locations`) all have public-read RLS policies,
 * so the anon key is sufficient.
 */

import "server-only";
import type { City } from "@/lib/cities";
import type { VehicleType } from "@/lib/vehicle-types";
import { createServerClient } from "@/lib/supabase/server";

export type CompanyStatus = "unclaimed" | "claimed" | "verified";

export type AmenityKey =
  | "airport_pickup"
  | "airport_delivery"
  | "city_delivery"
  | "cross_border"
  | "english_staff"
  | "service_24_7"
  | "child_seats"
  | "winter_tires"
  | "long_term_discount"
  | "card_payment";

export type Listing = {
  id: string;
  slug: string;
  name: string;
  city: City["slug"];
  country: City["countryCode"];
  status: CompanyStatus;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  description?: string;
  fleet: {
    countMin: number;
    countMax: number;
    description: string;
  };
  amenities: AmenityKey[];
  vehicleTypes: VehicleType[];
};

export const AMENITY_LABELS: Record<AmenityKey, string> = {
  airport_pickup: "Airport pickup",
  airport_delivery: "Airport delivery",
  city_delivery: "City delivery",
  cross_border: "Cross-border allowed",
  english_staff: "English-speaking staff",
  service_24_7: "24/7 service",
  child_seats: "Child seats",
  winter_tires: "Winter tires included",
  long_term_discount: "Long-term discounts",
  card_payment: "Card payments",
};

export type ListingFilter = {
  city?: string;
  vehicleType?: VehicleType;
};

const SELECT_LISTING = `
  id,
  slug,
  name,
  city,
  country,
  status,
  phone,
  whatsapp,
  email,
  website,
  description,
  vehicle_types,
  company_amenities ( amenity_key, value ),
  company_fleet_summary ( fleet_count_min, fleet_count_max, fleet_description ),
  locations ( address, is_primary )
` as const;

const STATUS_PRIORITY: Record<CompanyStatus, number> = {
  verified: 0,
  claimed: 1,
  unclaimed: 2,
};

/**
 * Returns listings, optionally filtered by city slug and/or vehicle type.
 * `city: 'all'` (or omitted) returns all cities.
 */
export async function filterListings(filter: ListingFilter = {}): Promise<Listing[]> {
  const supabase = createServerClient();

  let q = supabase.from("companies").select(SELECT_LISTING);

  if (filter.city && filter.city !== "all") {
    q = q.eq("city", filter.city as "riga" | "tallinn" | "vilnius");
  }
  if (filter.vehicleType) {
    q = q.contains("vehicle_types", [filter.vehicleType]);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? [])
    .map(rowToListing)
    .sort(
      (a, b) =>
        STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] ||
        a.name.localeCompare(b.name),
    );
}

export async function getListingsByCity(city: string): Promise<Listing[]> {
  return filterListings({ city });
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select(SELECT_LISTING)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToListing(data);
}

/** First N listings sorted by status (verified first), used on the homepage. */
export async function getFeaturedListings(limit = 3): Promise<Listing[]> {
  const all = await filterListings();
  return all.slice(0, limit);
}

/** Used by `generateStaticParams` for company profile pages. */
export async function getAllListingSlugs(): Promise<string[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase.from("companies").select("slug");
  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}

/* ---------------------------------------------------------------------------
 * Internal: row → Listing transform
 * ------------------------------------------------------------------------- */

type LocationRow = { address: string; is_primary: boolean };
type AmenityRow = { amenity_key: string; value: boolean };
type FleetRow = {
  fleet_count_min: number | null;
  fleet_count_max: number | null;
  fleet_description: string | null;
};

type CompanyRow = {
  id: string;
  slug: string;
  name: string;
  city: "riga" | "tallinn" | "vilnius";
  country: "LV" | "EE" | "LT";
  status: CompanyStatus;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  vehicle_types: string[];
  // Supabase returns nested relations as either an object (1:1) or array (1:many).
  // We keep both possibilities in the type and normalize at runtime.
  company_amenities: AmenityRow[] | null;
  company_fleet_summary: FleetRow | FleetRow[] | null;
  locations: LocationRow[] | null;
};

function rowToListing(row: CompanyRow): Listing {
  const amenities = (row.company_amenities ?? [])
    .filter((a) => a.value)
    .map((a) => a.amenity_key as AmenityKey);

  const fleet = normalizeFleet(row.company_fleet_summary);
  const primaryLocation =
    (row.locations ?? []).find((l) => l.is_primary) ??
    (row.locations ?? [])[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    country: row.country,
    status: row.status,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    address: primaryLocation?.address ?? undefined,
    description: row.description ?? undefined,
    fleet: {
      countMin: fleet?.fleet_count_min ?? 0,
      countMax: fleet?.fleet_count_max ?? 0,
      description: fleet?.fleet_description ?? "",
    },
    amenities,
    vehicleTypes: (row.vehicle_types ?? []) as VehicleType[],
  };
}

function normalizeFleet(input: FleetRow | FleetRow[] | null): FleetRow | null {
  if (!input) return null;
  return Array.isArray(input) ? (input[0] ?? null) : input;
}
