/**
 * Pure type & label definitions for the listings domain.
 *
 * This module is intentionally free of any server-only imports so it can be
 * pulled into client components (e.g. ListingCard, ListingsMap) without
 * forcing the Supabase server client into the browser bundle. The companion
 * `listings.ts` module is `import "server-only"` and exposes the actual query
 * helpers (filterListings, getListingBySlug, ...).
 */

import type { City } from "@/lib/cities";
import type { VehicleType } from "@/lib/vehicle-types";

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
  /** Year the operator was founded. Surfaced in list rows as "Since 2012". */
  foundedYear?: number;
  coordinates?: { lat: number; lng: number };
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
