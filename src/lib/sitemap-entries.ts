import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { getAllListingSlugs } from "@/lib/listings";
import { getAllIntentParams } from "@/lib/seo/intents";

const BASE = "https://carrentdesk.com";

/** All indexable marketing URLs for the sitemap. */
export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
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

export function sitemapEntriesToXml(entries: MetadataRoute.Sitemap): string {
  const body = entries
    .map((entry) => {
      const parts = [`<loc>${escapeXml(entry.url)}</loc>`];
      if (entry.lastModified) {
        parts.push(`<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`);
      }
      if (entry.changeFrequency) {
        parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (entry.priority !== undefined) {
        parts.push(`<priority>${entry.priority}</priority>`);
      }
      return `<url>${parts.join("")}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
