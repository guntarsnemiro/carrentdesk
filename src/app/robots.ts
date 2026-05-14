import type { MetadataRoute } from "next";

/**
 * Search-engine crawl rules.
 *
 * Allow everything except the API surface (no SEO value, and a few of the
 * routes there are write-only). Sitemap link helps Google / Bing discover
 * deep pages faster.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://carrentdesk.com/sitemap.xml",
    host: "https://carrentdesk.com",
  };
}
