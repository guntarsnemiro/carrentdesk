import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { getAllListingSlugs } from "@/lib/listings";
import { getAllIntentParams } from "@/lib/seo/intents";

const BASE = "https://carrentdesk.com";
const COMPANIES_PER_SITEMAP = 2000;

/** Split company URLs across sitemaps so generation stays fast and reliable. */
export async function generateSitemaps() {
  const slugs = await getAllListingSlugs();
  const companyChunks = Math.max(1, Math.ceil(slugs.length / COMPANIES_PER_SITEMAP));
  // id 0 = static + cities + intents; id 1+ = company chunks
  return [{ id: 0 }, ...Array.from({ length: companyChunks }, (_, i) => ({ id: i + 1 }))];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  if (id === 0) {
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

    return [...staticRoutes, ...cityRoutes, ...intentRoutes];
  }

  const slugs = await getAllListingSlugs();
  const chunkIndex = id - 1;
  const start = chunkIndex * COMPANIES_PER_SITEMAP;
  const chunk = slugs.slice(start, start + COMPANIES_PER_SITEMAP);

  return chunk.map((slug) => ({
    url: `${BASE}/c/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}
