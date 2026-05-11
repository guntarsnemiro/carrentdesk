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
  logoUrl?: string;
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
  logo_url,
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

/**
 * Verified operators only, capped at `limit`. Used on the homepage's
 * "Featured rentals" strip. Unverified rentals get a different (text-list)
 * treatment elsewhere on the site.
 */
export async function getFeaturedListings(limit = 3): Promise<Listing[]> {
  const all = await filterListings();
  return all.filter((l) => l.status === "verified").slice(0, limit);
}

/** Used by `generateStaticParams` for company profile pages. */
export async function getAllListingSlugs(): Promise<string[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("companies")
    .select("slug")
    .returns<{ slug: string }[]>();
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
  logo_url: string | null;
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
    name: cleanDisplayName(row.name),
    city: row.city,
    country: row.country,
    status: row.status,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    address: primaryLocation?.address ?? undefined,
    description: row.description ?? undefined,
    logoUrl: row.logo_url ?? undefined,
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

/* ---------------------------------------------------------------------------
 * Display-name cleanup.
 *
 * Google Maps names are often messy: ALL CAPS, multilingual slashes, location
 * suffixes like "in Tallinn", trailing parentheticals, generic "Car Rental"
 * boilerplate. We keep the original `name` in the DB (so we can re-match on
 * re-scrape and operators recognize themselves) but display a cleaned version.
 *
 * Operators can override this with their own preferred name once they claim.
 * ------------------------------------------------------------------------- */

const CITY_COMMA = /,\s+(Tallinn|Riga|R\u012bga|Vilnius)(\s+car\s+rentals?)?\s*$/iu;
const CITY_IN = /\s+in\s+(Tallinn|Riga|R\u012bga|Vilnius|Estonia|Latvia|Lithuania)\s*$/iu;
const CITY_TRAILING = /\s+(Tallinn|Riga|R\u012bga|Vilnius|Estonia|Latvia|Lithuania)\s*$/iu;
// Note: `autorent` deliberately excluded — it's a real Estonian brand suffix
// ("Eesti Autorent", "Sir Autorent OÜ"), not boilerplate.
const RENTAL_BOILERPLATE = /(car rental services?|car rentals?|car rent|rent a car|rental services?|automobili[u\u0173] nuomos?|auto noma|autonuoma)/i;

function cleanDisplayName(raw: string): string {
  let s = raw.trim();

  // Hard rules — always apply.
  s = s.replace(/\s*\([^)]*\)\s*$/u, "").trim(); // trailing parens
  if (/[\u0400-\u04FF]/.test(s) && s.includes(" / ")) {
    s = s.split(" / ")[0].trim(); // Cyrillic blob
  }
  if (s.length > 35 && s.includes(" / ")) {
    s = s.split(" / ")[0].trim(); // long bilingual
  }
  if (s.includes(" | ")) {
    s = s.split(" | ")[0].trim(); // pipe-separated suffix
  }
  s = s.replace(CITY_COMMA, "").trim();

  // Soft rules — each can be reverted if it leaves a useless stub.
  s = trySoftRule(s, (x) => x.replace(CITY_IN, "").trim());
  s = trySoftRule(s, (x) => x.replace(CITY_TRAILING, "").trim());
  s = trySoftRule(s, (x) =>
    x.replace(new RegExp(`\\s*[-\u2013\u2014]?\\s*${RENTAL_BOILERPLATE.source}\\s*$`, "i"), "").trim(),
  );

  // ALL CAPS (>= 4 chars) -> Title Case
  if (s.length >= 4 && s === s.toUpperCase() && /[A-Z]/.test(s)) {
    s = titleCase(s);
  }

  s = s.replace(/\s+/g, " ").trim();
  return s.length < 2 ? raw.trim() : s;
}

function trySoftRule(input: string, rule: (s: string) => string): string {
  const after = rule(input).trim();
  if (
    after.length < 4 ||
    /^(car|auto|rent|the|a|in|at|of|on)\s*$/i.test(after) ||
    /^(car|auto)\s+(rent|rental)s?(\s+in)?\s*$/i.test(after) ||
    /^(Tallinn|Riga|R\u012bga|Vilnius|Estonia|Latvia|Lithuania)\s*$/i.test(after) ||
    /[-\u2013\u2014]\s*$/.test(after) ||
    // Single short word is probably a generic English word, not a brand
    (!/\s/.test(after) && after.length < 8)
  ) {
    return input;
  }
  return after;
}

const KEEP_UPPERCASE = new Set([
  "OU",
  "O\u00dc",
  "SIA",
  "UAB",
  "GMBH",
  "BV",
  "AS",
  "AB",
  "SP",
  "EU",
  "EV",
  "DBA",
  "VIP",
  "VNO",
  "RIX",
  "TLL",
]);

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part) || part === "-") return part;
      const upper = part.toUpperCase();
      if (KEEP_UPPERCASE.has(upper)) return upper;
      // Preserve common name patterns like "EZrent", "addCar", etc by leaving
      // mixed-case original tokens alone elsewhere — here we only run on
      // already-uppercase strings so we always title-case.
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}
