/**
 * Sample listing data used while we seed the real database.
 * Shape mirrors what we'll fetch from Supabase tomorrow, so the UI does
 * not need to change when we swap the data source.
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

export const SAMPLE_LISTINGS: Listing[] = [
  {
    id: "demo-baltic-car-rent",
    slug: "baltic-car-rent",
    name: "Baltic Car Rent",
    city: "riga",
    country: "LV",
    status: "verified",
    phone: "+371 2000 0000",
    whatsapp: "+371 2000 0000",
    email: "info@balticcarrent.lv",
    website: "https://balticcarrent.lv",
    address: "Brīvības iela 100, Riga",
    description:
      "Family-run rental near the city center. English-speaking staff, free airport pickup, and one of the largest fleets of automatic diesels in Riga.",
    fleet: {
      countMin: 30,
      countMax: 40,
      description: "Mostly 3–7 year automatic diesels, plus a few SUVs and 9-seat vans.",
    },
    amenities: [
      "airport_pickup",
      "airport_delivery",
      "city_delivery",
      "cross_border",
      "english_staff",
      "child_seats",
      "winter_tires",
      "long_term_discount",
      "card_payment",
    ],
    vehicleTypes: ["economy", "mid_size", "suv", "nine_seater"],
  },
  {
    id: "demo-busrent",
    slug: "busrent",
    name: "Busrent",
    city: "riga",
    country: "LV",
    status: "claimed",
    phone: "+371 2111 1111",
    email: "info@busrent.lv",
    website: "https://busrent.lv",
    address: "Krasta iela 200, Riga",
    description:
      "Specialists in 9-seater vans and minibuses for groups, weddings, and tour operators.",
    fleet: {
      countMin: 12,
      countMax: 18,
      description: "9-seat passenger vans, mostly 5–8 year diesels, automatic gearboxes.",
    },
    amenities: [
      "airport_pickup",
      "city_delivery",
      "cross_border",
      "english_staff",
      "long_term_discount",
      "card_payment",
    ],
    vehicleTypes: ["van", "nine_seater"],
  },
  {
    id: "demo-ecorent",
    slug: "ecorent",
    name: "Ecorent",
    city: "riga",
    country: "LV",
    status: "unclaimed",
    phone: "+371 2222 2222",
    website: "https://ecorent.lv",
    address: "Ganību dambis 30, Riga",
    fleet: {
      countMin: 8,
      countMax: 12,
      description: "5–10 year automatic diesels and a few hybrids. Economy and mid-size only.",
    },
    amenities: ["airport_pickup", "english_staff", "card_payment"],
    vehicleTypes: ["economy", "mid_size", "electric"],
  },
  {
    id: "demo-tallinn-classic",
    slug: "tallinn-classic-rentals",
    name: "Tallinn Classic Rentals",
    city: "tallinn",
    country: "EE",
    status: "claimed",
    phone: "+372 5000 0000",
    email: "info@example.ee",
    address: "Pärnu mnt 50, Tallinn",
    description:
      "Reliable mid-size and economy rentals near the old town and Lennart Meri airport.",
    fleet: {
      countMin: 15,
      countMax: 20,
      description: "Mostly 4–8 year automatic diesels, with a couple of SUVs.",
    },
    amenities: ["airport_pickup", "english_staff", "winter_tires", "card_payment"],
    vehicleTypes: ["economy", "mid_size", "suv"],
  },
  {
    id: "demo-vilnius-fairway",
    slug: "vilnius-fairway",
    name: "Fairway Rent",
    city: "vilnius",
    country: "LT",
    status: "unclaimed",
    phone: "+370 6000 0000",
    address: "Gedimino pr. 25, Vilnius",
    fleet: {
      countMin: 10,
      countMax: 15,
      description: "5–9 year automatic diesels, plus a few 7-seater minivans.",
    },
    amenities: ["airport_pickup", "english_staff", "long_term_discount", "card_payment"],
    vehicleTypes: ["economy", "mid_size", "van"],
  },
];

export type ListingFilter = {
  city?: string;
  vehicleType?: VehicleType;
};

export function filterListings(filter: ListingFilter = {}): Listing[] {
  return SAMPLE_LISTINGS.filter((l) => {
    if (filter.city && filter.city !== "all" && l.city !== filter.city) return false;
    if (filter.vehicleType && !l.vehicleTypes.includes(filter.vehicleType)) return false;
    return true;
  });
}

export function getListingsByCity(city: string): Listing[] {
  return filterListings({ city });
}

export function getListingBySlug(slug: string): Listing | undefined {
  return SAMPLE_LISTINGS.find((l) => l.slug === slug);
}
