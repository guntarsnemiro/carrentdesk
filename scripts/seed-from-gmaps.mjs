#!/usr/bin/env node
/**
 * Filter + normalize the Apify Google Maps Scraper export into a clean list
 * of unclaimed listings ready to seed into Supabase.
 *
 *   Input : scripts/raw/gmaps-rentals.json    (Apify export)
 *   Output: scripts/raw/listings-normalized.json   (review-friendly)
 *           scripts/raw/listings-seed.sql          (executable SQL)
 *
 * Run with:
 *   node scripts/seed-from-gmaps.mjs
 *
 * The script does NOT touch the database. Review the outputs first, then
 * have the agent execute `listings-seed.sql` via the Supabase MCP.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const rawPath = path.join(here, "raw", "gmaps-rentals.json");
const normPath = path.join(here, "raw", "listings-normalized.json");
const sqlPath = path.join(here, "raw", "listings-seed.sql");

// ---------------------------------------------------------------------------
// Filter rules
// ---------------------------------------------------------------------------

const BIG_CHAIN_PATTERNS = [
  /\bsixt\b/i,
  /\bhertz\b/i,
  /\bavis\b/i,
  /\beuropcar\b/i,
  /\benterprise\b/i,
  /\b(budget rent|budget car)/i,
  /\balamo\b/i,
  /\bnational\s*car/i,
  /\bthrifty\b/i,
  /\bdollar rent/i,
  /\bbuchbinder\b/i,
  /\bright cars?\b/i,
  /\bgreen motion\b/i,
  /\brentalcars?\b/i,
  /\bdiscovercars?\b/i,
  /\baddcarrental\b/i,
  /\bautoeurope\b/i,
  /\bkayak\b/i,
  /\bkemwel\b/i,
  /\bfirefly\b/i,
  /\bsurprice\b/i,
  /\bpayless\b/i,
  /\beasirent\b/i,
  /\bdrivalia\b/i,
  /\bgoldcar\b/i,
  /\bcentauro\b/i,
  /\binterrent\b/i,
];

// Categories we keep (anything else is dropped — usually leasing, dealers, etc.)
const ALLOWED_CATEGORIES = new Set([
  "Car rental agency",
  "Truck rental agency",
  "Van rental agency",
  "Motor vehicle dealer",
]);

// Slugs we already seeded by hand — don't double-insert.
const EXISTING_SLUGS = new Set([
  "baltic-car-rent",
  "busrent",
  "ecorent",
  "tallinn-classic-rentals",
  "vilnius-fairway",
]);

// Apify country code → our city_slug enum
const CITY_BY_COUNTRY = {
  LV: "riga",
  EE: "tallinn",
  LT: "vilnius",
};

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}

function inferVehicleTypes(record) {
  const text = [record.title, record.categoryName, record.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const types = new Set();

  if (/\b(van|minivan|bus|transport|microbus|9.?seat|nine.?seat)\b/.test(text)) {
    types.add("van");
    types.add("nine_seater");
  }
  if (/\b(electric|tesla|\bev\b|hybrid|model\s*[35y])\b/.test(text)) {
    types.add("electric");
  }
  if (/\b(suv|crossover|4x4|land\s*rover|toureg|range\s*rover)\b/.test(text)) {
    types.add("suv");
  }
  if (/\b(luxury|premium|sport|audi|mercedes|bmw|porsche|ferrari)\b/.test(text)) {
    types.add("mid_size");
    types.add("suv");
  }

  // Default for anything classified as a generic car rental.
  if (types.size === 0) {
    types.add("economy");
    types.add("mid_size");
  }

  return [...types];
}

function pickPhone(record) {
  return record.phoneUnformatted || record.phone || null;
}

function pickWebsite(record) {
  if (!record.website) return null;
  // strip tracking params
  try {
    const u = new URL(record.website);
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return record.website;
  }
}

function pickAddress(record) {
  return record.address || [record.street, record.city].filter(Boolean).join(", ") || null;
}

function sqlEscape(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    const items = value.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",");
    return `array[${items}]::text[]`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

const raw = JSON.parse(readFileSync(rawPath, "utf8"));
console.log(`Loaded ${raw.length} raw records from Apify.`);

const dropped = {
  closed: 0,
  category: 0,
  big_chain: 0,
  no_contact: 0,
  duplicate: 0,
  duplicate_phone: 0,
  duplicate_website: 0,
  no_country: 0,
};

const seenSlugs = new Set(EXISTING_SLUGS);
const seenPhones = new Set();
const seenWebsiteHosts = new Set();
const normalized = [];

function phoneKey(p) {
  return p ? p.replace(/\D/g, "") : null;
}
function websiteKey(w) {
  if (!w) return null;
  try {
    return new URL(w).host.replace(/^www\./, "").toLowerCase();
  } catch {
    return w.toLowerCase();
  }
}

for (const r of raw) {
  if (r.permanentlyClosed || r.temporarilyClosed) {
    dropped.closed++;
    continue;
  }
  if (!ALLOWED_CATEGORIES.has(r.categoryName)) {
    dropped.category++;
    continue;
  }
  if (BIG_CHAIN_PATTERNS.some((p) => p.test(r.title))) {
    dropped.big_chain++;
    continue;
  }
  const phone = pickPhone(r);
  const website = pickWebsite(r);
  if (!phone && !website) {
    dropped.no_contact++;
    continue;
  }
  const city = CITY_BY_COUNTRY[r.countryCode];
  if (!city) {
    dropped.no_country++;
    continue;
  }

  // Dedup by phone (same operator listed twice under different names)
  const pk = phoneKey(phone);
  if (pk && seenPhones.has(pk)) {
    dropped.duplicate_phone++;
    continue;
  }
  // Dedup by website host (same brand, multiple location pins)
  const wk = websiteKey(website);
  if (wk && seenWebsiteHosts.has(wk)) {
    dropped.duplicate_website++;
    continue;
  }

  let slug = slugify(r.title);
  if (!slug) {
    dropped.category++;
    continue;
  }
  if (seenSlugs.has(slug)) {
    // try city-suffixed slug, then numeric suffix
    const withCity = slugify(`${r.title} ${city}`);
    if (!seenSlugs.has(withCity)) {
      slug = withCity;
    } else {
      let n = 2;
      while (seenSlugs.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
  }
  if (seenSlugs.has(slug)) {
    dropped.duplicate++;
    continue;
  }
  seenSlugs.add(slug);
  if (pk) seenPhones.add(pk);
  if (wk) seenWebsiteHosts.add(wk);

  normalized.push({
    slug,
    name: r.title,
    city,
    country: r.countryCode,
    status: "unclaimed",
    phone,
    website,
    address: pickAddress(r),
    lat: r.location?.lat ?? null,
    lng: r.location?.lng ?? null,
    vehicle_types: inferVehicleTypes(r),
    google_rating: r.totalScore ?? null,
    google_reviews: r.reviewsCount ?? null,
    google_url: r.url ?? null,
  });
}

console.log("\nDropped:");
for (const [k, v] of Object.entries(dropped)) console.log(`  ${k}: ${v}`);
console.log(`\nKeeping: ${normalized.length}`);
console.log("\nBy city:");
const byCity = {};
for (const n of normalized) byCity[n.city] = (byCity[n.city] || 0) + 1;
for (const [city, count] of Object.entries(byCity)) {
  console.log(`  ${city}: ${count}`);
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

writeFileSync(normPath, JSON.stringify(normalized, null, 2));
console.log(`\nNormalized JSON → ${normPath}`);

// Build SQL
const sqlLines = [];
sqlLines.push("-- Auto-generated by scripts/seed-from-gmaps.mjs");
sqlLines.push(`-- Source: scripts/raw/gmaps-rentals.json`);
sqlLines.push(`-- Records: ${normalized.length}`);
sqlLines.push("");
sqlLines.push("begin;");
sqlLines.push("");
sqlLines.push("-- 1. Companies");
sqlLines.push(
  "insert into public.companies (slug, name, city, country, status, phone, website, vehicle_types) values"
);
sqlLines.push(
  normalized
    .map(
      (n) =>
        `  (${sqlEscape(n.slug)}, ${sqlEscape(n.name)}, ${sqlEscape(n.city)}, ${sqlEscape(n.country)}, 'unclaimed', ${sqlEscape(n.phone)}, ${sqlEscape(n.website)}, ${sqlEscape(n.vehicle_types)})`
    )
    .join(",\n")
);
sqlLines.push("on conflict (slug) do nothing;");
sqlLines.push("");
sqlLines.push("-- 2. Primary locations (one per company)");
for (const n of normalized) {
  if (!n.address) continue;
  sqlLines.push(
    `insert into public.locations (company_id, address, is_primary, lat, lng) ` +
      `select id, ${sqlEscape(n.address)}, true, ${sqlEscape(n.lat)}, ${sqlEscape(n.lng)} ` +
      `from public.companies where slug = ${sqlEscape(n.slug)} ` +
      `and not exists (select 1 from public.locations where company_id = public.companies.id and is_primary);`
  );
}
sqlLines.push("");
sqlLines.push("commit;");

writeFileSync(sqlPath, sqlLines.join("\n"));
console.log(`Seed SQL       → ${sqlPath}`);
console.log("\nNext: have the agent execute the SQL via Supabase MCP.");
