/**
 * Single-segment paths that must never be handled by /[city].
 * Without this guard, e.g. /sitemap.xml is treated as city slug "sitemap.xml".
 */
export const RESERVED_ROOT_SLUGS = new Set([
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "manifest.webmanifest",
  "opengraph-image",
  "twitter-image",
  "icon.svg",
  "apple-icon.png",
]);

export function isReservedRootSlug(slug: string): boolean {
  return RESERVED_ROOT_SLUGS.has(slug) || slug.startsWith("_next");
}
