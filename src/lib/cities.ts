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
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
