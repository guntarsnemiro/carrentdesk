export type City = {
  slug: string;
  name: string;
  country: string;
  countryCode: "LV" | "EE" | "LT";
  tagline: string;
  /** Approximate listing count shown on cards while we seed real data. */
  placeholderCount: number;
  /** CSS gradient used as a fallback / map placeholder until we have real city photography. */
  gradient: string;
  /** External photo URL (Unsplash). If it fails to load, the gradient shows behind. */
  photoUrl: string;
  /**
   * Approximate city-center coordinates [lat, lng]. Used as the fallback
   * center for the listings map when no listing in the current filter has
   * coordinates yet. Real listings will typically auto-fit bounds around
   * themselves and override this.
   */
  center: [number, number];
  /**
   * Primary international airport for the city. Used to compute & display
   * "X km airport" on listing rows. `code` is the IATA code for trust /
   * recognition ("4.2 km RIX" reads cleaner than "4.2 km Riga Airport").
   */
  airport: { code: "RIX" | "TLL" | "VNO"; lat: number; lng: number };
};

/**
 * Photo URLs are external (Unsplash) so we can swap them per-city without
 * committing binary assets. If a photo doesn't fit the brand later, change
 * just the `photoUrl` field and re-deploy.
 *
 * All three photos verified as taken in the listed city (location metadata
 * confirmed on Unsplash). Photographers credited via their Unsplash handles
 * in source comments below.
 */
export const CITIES: City[] = [
  {
    slug: "riga",
    name: "Riga",
    country: "Latvia",
    countryCode: "LV",
    tagline: "20+ local rentals across the capital and airport",
    placeholderCount: 22,
    gradient:
      "linear-gradient(135deg, #0f2a52 0%, #1d3771 45%, #5d8aca 100%)",
    // Aerial of Riga from St. Peter's Church, looking over the Daugava — © Milan Zmátlo
    photoUrl:
      "https://images.unsplash.com/photo-1609517760017-9b76ac28f0e9?auto=format&fit=crop&w=1200&q=80",
    center: [56.9496, 24.1052],
    airport: { code: "RIX", lat: 56.9236, lng: 23.9711 },
  },
  {
    slug: "tallinn",
    name: "Tallinn",
    country: "Estonia",
    countryCode: "EE",
    tagline: "Independent rentals in the old town and Lennart Meri",
    placeholderCount: 18,
    gradient:
      "linear-gradient(135deg, #0b3b46 0%, #15616d 50%, #78c0c9 100%)",
    // Tallinn Old Town from a high vantage point — © Max K.
    photoUrl:
      "https://images.unsplash.com/photo-1708593616197-77c8a47357b7?auto=format&fit=crop&w=1200&q=80",
    center: [59.437, 24.7536],
    airport: { code: "TLL", lat: 59.4133, lng: 24.8328 },
  },
  {
    slug: "vilnius",
    name: "Vilnius",
    country: "Lithuania",
    countryCode: "LT",
    tagline: "Fair-priced rentals with airport pickup",
    placeholderCount: 16,
    gradient:
      "linear-gradient(135deg, #3a1c2e 0%, #6b2a48 50%, #d97706 100%)",
    // Vilnius Cathedral & bell tower — © Karina Kegy
    photoUrl:
      "https://images.unsplash.com/photo-1609618486710-af2cf3afb233?auto=format&fit=crop&w=1200&q=80",
    center: [54.6872, 25.2797],
    airport: { code: "VNO", lat: 54.6341, lng: 25.2858 },
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
