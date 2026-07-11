import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { getAllListingSlugs } from "@/lib/listings";
import { getAllIntentParams } from "@/lib/seo/intents";

const BASE = "https://carrentdesk.com";

/** Regenerate hourly so new scraped listings appear without redeploying. */
export const revalidate = 3600;

/**
 * Single sitemap at /sitemap.xml (same pattern as /robots.txt).
 *
 * Avoids generateSitemaps() — that split the index onto /sitemap.xml which
 * collided with the /[city] dynamic route (city = "sitemap.xml" → 404).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/all`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${BASE}/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const intentRoutes: MetadataRoute.Sitemap = getAllIntentParams(CITIES).map(
    ({ city, intent }) => ({
      url: `${BASE}/${city}/${intent}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  const slugs = await getAllListingSlugs();
  const companyRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE}/c/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...cityRoutes, ...intentRoutes, ...companyRoutes];
}
