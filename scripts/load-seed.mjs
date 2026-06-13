#!/usr/bin/env node
/**
 * Loads scripts/raw/listings-normalized.json into Supabase via the service-role
 * client (PostgREST bulk upsert). Safe to re-run — upserts on `slug`.
 *
 * Run with:
 *   node --env-file=.env.local scripts/load-seed.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const normPath = path.join(here, "raw", "listings-normalized.json");
const rows = JSON.parse(readFileSync(normPath, "utf8"));
console.log(`Loaded ${rows.length} normalized listings.`);

// 1. Upsert companies
const companyRows = rows.map((n) => ({
  slug: n.slug,
  name: n.name,
  city: n.city,
  country: n.country,
  status: "unclaimed",
  phone: n.phone,
  website: n.website,
  vehicle_types: n.vehicle_types,
  google_rating: n.google_rating,
  google_reviews: n.google_reviews,
  google_url: n.google_url,
  description: n.description,
  address: n.address,
}));

const { data: upserted, error: upErr } = await db
  .from("companies")
  .upsert(companyRows, { onConflict: "slug" })
  .select("id, slug");

if (upErr) {
  console.error("❌  Company upsert failed:", upErr.message);
  process.exit(1);
}
console.log(`✅  Upserted ${upserted.length} companies.`);

const idBySlug = new Map(upserted.map((c) => [c.slug, c.id]));

// 2. Find which companies already have a primary location.
// Chunk the .in() lookup — a single 600+ id filter blows past PostgREST's URL limit.
const ids = [...idBySlug.values()];
const hasPrimary = new Set();
const CHUNK = 100;
for (let i = 0; i < ids.length; i += CHUNK) {
  const slice = ids.slice(i, i + CHUNK);
  const { data: existingLocs, error: locErr } = await db
    .from("locations")
    .select("company_id")
    .in("company_id", slice)
    .eq("is_primary", true);
  if (locErr) {
    console.error("❌  Location lookup failed:", locErr.message);
    process.exit(1);
  }
  for (const l of existingLocs ?? []) hasPrimary.add(l.company_id);
}

// 3. Insert primary locations for companies that have coords but no location
const newLocations = [];
for (const n of rows) {
  if (!n.lat || !n.lng) continue;
  const id = idBySlug.get(n.slug);
  if (!id || hasPrimary.has(id)) continue;
  newLocations.push({
    company_id: id,
    address: n.address,
    is_primary: true,
    lat: n.lat,
    lng: n.lng,
  });
}

if (newLocations.length) {
  for (let i = 0; i < newLocations.length; i += CHUNK) {
    const { error: insErr } = await db.from("locations").insert(newLocations.slice(i, i + CHUNK));
    if (insErr) {
      console.error("❌  Location insert failed:", insErr.message);
      process.exit(1);
    }
  }
  console.log(`✅  Inserted ${newLocations.length} primary locations.`);
} else {
  console.log("ℹ️   No new locations to insert.");
}

console.log("\n🎯  Done.");
