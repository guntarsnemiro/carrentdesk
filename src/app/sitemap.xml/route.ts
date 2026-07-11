import { buildSitemapEntries, sitemapEntriesToXml } from "@/lib/sitemap-entries";

/** Regenerate hourly so new scraped listings appear without redeploying. */
export const revalidate = 3600;

/**
 * Explicit /sitemap.xml route — static segment wins over /[city], which otherwise
 * treats "sitemap.xml" as a city slug on Vercel.
 */
export async function GET() {
  const entries = await buildSitemapEntries();
  const xml = sitemapEntriesToXml(entries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
