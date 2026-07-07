import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { getAllListingSlugs } from "@/lib/listings";
import { getAllIntentParams } from "@/lib/seo/intents";

const BASE = "https://carrentdesk.com";

/**
 * Dynamic sitemap.
 *
 * Includes every public route Google should crawl:
 *   - Static pages (home, /all, /for-rentals)
 *   - Per-city pages
 *   - Per-city × per-intent SEO landing pages
 *   - Per-company profile pages (sourced from Supabase)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllListingSlugs();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/all`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${BASE}/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // City × intent SEO landing pages (~100 pages)
  const intentRoutes: MetadataRoute.Sitemap = getAllIntentParams(CITIES).map(({ city, intent }) => ({
    url: `${BASE}/${city}/${intent}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const listingRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE}/c/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...cityRoutes, ...intentRoutes, ...listingRoutes];
}
