export type City = {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
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
   * Undefined for cities without a major airport.
   */
  airport?: { code: string; lat: number; lng: number };
  /** Default currency code for the country. */
  currency: string;
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
  // ── Baltics ──────────────────────────────────────────────────────
  {
    slug: "riga",
    name: "Riga",
    country: "Latvia",
    countryCode: "LV",
    currency: "EUR",
    tagline: "20+ local rentals across the capital and airport",
    placeholderCount: 22,
    gradient: "linear-gradient(135deg, #0f2a52 0%, #1d3771 45%, #5d8aca 100%)",
    photoUrl: "https://images.unsplash.com/photo-1609517760017-9b76ac28f0e9?auto=format&fit=crop&w=1200&q=80",
    center: [56.9496, 24.1052],
    airport: { code: "RIX", lat: 56.9236, lng: 23.9711 },
  },
  {
    slug: "tallinn",
    name: "Tallinn",
    country: "Estonia",
    countryCode: "EE",
    currency: "EUR",
    tagline: "Independent rentals in the old town and Lennart Meri",
    placeholderCount: 18,
    gradient: "linear-gradient(135deg, #0b3b46 0%, #15616d 50%, #78c0c9 100%)",
    photoUrl: "https://images.unsplash.com/photo-1708593616197-77c8a47357b7?auto=format&fit=crop&w=1200&q=80",
    center: [59.437, 24.7536],
    airport: { code: "TLL", lat: 59.4133, lng: 24.8328 },
  },
  {
    slug: "vilnius",
    name: "Vilnius",
    country: "Lithuania",
    countryCode: "LT",
    currency: "EUR",
    tagline: "Fair-priced rentals with airport pickup",
    placeholderCount: 16,
    gradient: "linear-gradient(135deg, #3a1c2e 0%, #6b2a48 50%, #d97706 100%)",
    photoUrl: "https://images.unsplash.com/photo-1609618486710-af2cf3afb233?auto=format&fit=crop&w=1200&q=80",
    center: [54.6872, 25.2797],
    airport: { code: "VNO", lat: 54.6341, lng: 25.2858 },
  },
  {
    slug: "parnu",
    name: "Pärnu",
    country: "Estonia",
    countryCode: "EE",
    currency: "EUR",
    tagline: "Coastal rentals in Estonia's summer capital",
    placeholderCount: 5,
    gradient: "linear-gradient(135deg, #0b3b46 0%, #1a6b7a 50%, #5bb8c4 100%)",
    photoUrl: "https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=1200&q=80",
    center: [58.3851, 24.4997],
    airport: { code: "EPU", lat: 58.4199, lng: 24.4728 },
  },
  {
    slug: "kaunas",
    name: "Kaunas",
    country: "Lithuania",
    countryCode: "LT",
    currency: "EUR",
    tagline: "Local rentals in Lithuania's second city",
    placeholderCount: 7,
    gradient: "linear-gradient(135deg, #2d1b4e 0%, #553a8c 50%, #9b72cf 100%)",
    photoUrl: "https://images.unsplash.com/photo-1744183661929-e76ccb98f013?auto=format&fit=crop&w=1200&q=80",
    center: [54.8985, 23.9036],
    airport: { code: "KUN", lat: 54.9639, lng: 24.0848 },
  },

  // ── Scandinavia ───────────────────────────────────────────────────
  {
    slug: "stockholm",
    name: "Stockholm",
    country: "Sweden",
    countryCode: "SE",
    currency: "SEK",
    tagline: "Local car rentals across the Swedish capital",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #006aa7 0%, #004f80 50%, #fecc02 100%)",
    photoUrl: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=80",
    center: [59.3293, 18.0686],
    airport: { code: "ARN", lat: 59.6519, lng: 17.9186 },
  },
  {
    slug: "gothenburg",
    name: "Gothenburg",
    country: "Sweden",
    countryCode: "SE",
    currency: "SEK",
    tagline: "Affordable car rentals in Sweden's second city",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #004f80 0%, #006aa7 50%, #a8d8ea 100%)",
    photoUrl: "https://images.unsplash.com/photo-1601882589907-c72e9cefc9c1?auto=format&fit=crop&w=1200&q=80",
    center: [57.7089, 11.9746],
    airport: { code: "GOT", lat: 57.6628, lng: 12.2798 },
  },
  {
    slug: "malmo",
    name: "Malmö",
    country: "Sweden",
    countryCode: "SE",
    currency: "SEK",
    tagline: "Car rentals in southern Sweden, minutes from Copenhagen",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #1a3a5c 0%, #2e6fa3 50%, #7ab8d9 100%)",
    photoUrl: "https://images.unsplash.com/photo-1596386461350-326ccb383e9f?auto=format&fit=crop&w=1200&q=80",
    center: [55.6050, 13.0038],
  },
  {
    slug: "oslo",
    name: "Oslo",
    country: "Norway",
    countryCode: "NO",
    currency: "NOK",
    tagline: "Local car rentals in the Norwegian capital",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #002868 0%, #ef2b2d 50%, #ffffff 100%)",
    photoUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
    center: [59.9139, 10.7522],
    airport: { code: "OSL", lat: 60.1976, lng: 11.1004 },
  },
  {
    slug: "bergen",
    name: "Bergen",
    country: "Norway",
    countryCode: "NO",
    currency: "NOK",
    tagline: "Car rentals among Norway's fjords and mountains",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #1a3a2a 0%, #2d7a4f 50%, #7ec8a0 100%)",
    photoUrl: "https://images.unsplash.com/photo-1548690596-f1722c190938?auto=format&fit=crop&w=1200&q=80",
    center: [60.3913, 5.3221],
    airport: { code: "BGO", lat: 60.2934, lng: 5.2184 },
  },
  {
    slug: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    countryCode: "DK",
    currency: "DKK",
    tagline: "Local car rentals in the Danish capital",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #c60c30 0%, #8b0921 50%, #f4a7b9 100%)",
    photoUrl: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1200&q=80",
    center: [55.6761, 12.5683],
    airport: { code: "CPH", lat: 55.6180, lng: 12.6508 },
  },
  {
    slug: "aarhus",
    name: "Aarhus",
    country: "Denmark",
    countryCode: "DK",
    currency: "DKK",
    tagline: "Car rentals in Denmark's second largest city",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #8b0921 0%, #c60c30 50%, #e8a0ac 100%)",
    photoUrl: "https://images.unsplash.com/photo-1584721457944-a99abc0c74f6?auto=format&fit=crop&w=1200&q=80",
    center: [56.1629, 10.2039],
  },
  {
    slug: "helsinki",
    name: "Helsinki",
    country: "Finland",
    countryCode: "FI",
    currency: "EUR",
    tagline: "Local car rentals in the Finnish capital",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #003580 0%, #1a5fa8 50%, #75a8d8 100%)",
    photoUrl: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80",
    center: [60.1699, 24.9384],
    airport: { code: "HEL", lat: 60.3172, lng: 24.9633 },
  },
  {
    slug: "tampere",
    name: "Tampere",
    country: "Finland",
    countryCode: "FI",
    currency: "EUR",
    tagline: "Car rentals in Finland's vibrant second city",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #1a3a5c 0%, #2a5a8c 50%, #6a9bc4 100%)",
    photoUrl: "https://images.unsplash.com/photo-1619484671673-a2c72cf2bde2?auto=format&fit=crop&w=1200&q=80",
    center: [61.4978, 23.7610],
  },
  {
    slug: "reykjavik",
    name: "Reykjavik",
    country: "Iceland",
    countryCode: "IS",
    currency: "ISK",
    tagline: "Car rentals for the Ring Road and beyond",
    placeholderCount: 0,
    gradient: "linear-gradient(135deg, #003e7e 0%, #0066cc 50%, #89c4e1 100%)",
    photoUrl: "https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=1200&q=80",
    center: [64.1355, -21.8954],
    airport: { code: "KEF", lat: 63.9850, lng: -22.6056 },
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
