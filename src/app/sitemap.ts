import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { getAllListingSlugs } from "@/lib/listings";

const BASE = "https://carrentdesk.com";

/**
 * Dynamic sitemap.
 *
 * Includes every public route Google should crawl:
 *   - Static pages (home, /all, /for-rentals)
 *   - Per-city pages
 *   - Per-company profile pages (sourced from Supabase)
 *
 * Re-run on each request behind the global revalidate so newly-added
 * listings appear in the sitemap within a minute of being seeded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllListingSlugs();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/all`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/for-rentals`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${BASE}/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const listingRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE}/c/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...cityRoutes, ...listingRoutes];
}
