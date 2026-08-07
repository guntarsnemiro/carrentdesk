import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type JoinListingMatch = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  google_reviews: number | null;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function sanitizeIlike(input: string) {
  return input.replace(/[%_,]/g, "").trim();
}

function phoneKey(p: string | null | undefined) {
  return p ? p.replace(/\D/g, "") : "";
}

type Db = SupabaseClient<Database>;

export async function findJoinListingMatches(
  db: Db,
  params: { companyName: string; city: string; phone?: string }
): Promise<JoinListingMatch[]> {
  const name = sanitizeIlike(params.companyName);
  const baseSlug = slugify(params.companyName);
  if (!name || name.length < 2) return [];

  const seen = new Map<string, JoinListingMatch>();
  const pk = phoneKey(params.phone);

  async function query(orFilter: string) {
    const { data, error } = await db
      .from("companies")
      .select("id, slug, name, city, country, phone, website, google_rating, google_reviews, status")
      .eq("city", params.city as Database["public"]["Enums"]["city_slug"])
      .eq("status", "unclaimed")
      .or(orFilter)
      .order("google_reviews", { ascending: false, nullsFirst: false })
      .limit(5);

    if (error) throw error;
    for (const row of data ?? []) {
      seen.set(row.id, row as JoinListingMatch);
    }
  }

  await query(`name.ilike.%${name}%,slug.ilike.%${baseSlug}%`);

  const words = name.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length > 1 && seen.size < 3) {
    await query(`name.ilike.%${words[0]}%`);
  }

  if (pk.length >= 8) {
    const { data: phoneRows } = await db
      .from("companies")
      .select("id, slug, name, city, country, phone, website, google_rating, google_reviews, status")
      .eq("city", params.city as Database["public"]["Enums"]["city_slug"])
      .eq("status", "unclaimed")
      .not("phone", "is", null)
      .limit(20);

    for (const row of phoneRows ?? []) {
      if (phoneKey(row.phone) === pk) {
        seen.set(row.id, row as JoinListingMatch);
      }
    }
  }

  return [...seen.values()].slice(0, 3);
}

export { slugify };
