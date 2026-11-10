import { slugify } from "@/lib/join/signup-helpers";

/** Placeholder brand until the owner types the real one. */
export const DRAFT_BRAND = "New rental";

const RESERVED_PAGE_SLUGS = new Set([
  "app",
  "join",
  "admin",
  "api",
  "auth",
  "book",
  "claim",
  "contact",
  "for-rentals",
  "terms",
  "privacy",
  "login",
  "setup",
  "c",
  "www",
  "sitemap",
  "robots",
  "favicon",
]);

export function isDraftSlug(slug: string): boolean {
  return slug.startsWith("draft-");
}

export function pageSlugError(raw: string, citySlugs: string[]): string | null {
  const slug = slugify(raw);
  if (slug.length < 3) return "The page address needs at least 3 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Use letters, numbers, and hyphens.";
  if (RESERVED_PAGE_SLUGS.has(slug) || citySlugs.includes(slug) || isDraftSlug(slug)) {
    return "That page address is already used.";
  }
  return null;
}

export function advanceStep(current: number, next: number): number {
  return Math.max(current, Math.min(6, next));
}

/** Accepts balticcar.lv or a full https address. The dot stays. */
export function normalizeHomepage(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Enter the homepage, for example balticcar.lv.");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Enter a homepage like balticcar.lv.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Enter a homepage like balticcar.lv.");
  }
  const host = url.hostname.toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) || host.includes("..")) {
    throw new Error("Enter a homepage like balticcar.lv.");
  }
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `https://${host}${path}${url.search}`;
}

export function homepageField(stored: string | null | undefined): string {
  if (!stored) return "";
  return stored.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
