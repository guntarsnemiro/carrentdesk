#!/usr/bin/env node
/**
 * Geo-audit: verify every company's assigned city against its real pin (lat/lng).
 *
 * For each company that has a primary location we compute the distance to its
 * ASSIGNED city center and to the nearest city center IN THE SAME COUNTRY. If the
 * company is far from where it's listed (> FAR_KM) but very close to a different
 * city we have a page for (< NEAR_KM), it's a misclassification and we propose a
 * move. Pin coordinates are always the real Google location, so "nearest city we
 * cover, in the same country" is the correct page for that pin.
 *
 *   node --env-file=.env.local scripts/audit-geo.mjs            # report only
 *   node --env-file=.env.local scripts/audit-geo.mjs --apply    # write fixes
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const FAR_KM = 60;   // farther than this from its assigned city = suspicious
const NEAR_KM = 60;  // closer than this to another city = clearly belongs there

// Intra-archipelago moves are skipped: these islands are postal-routed correctly,
// but their city "center" sits at one end (e.g. Tenerife's center is in the north,
// so the southern rental hub is geometrically closer to La Gomera's center). Moving
// between members of the same cluster would mis-route postal-correct records.
const CLUSTERS = [
  ["tenerife", "gran-canaria", "lanzarote", "fuerteventura", "la-palma", "la-gomera", "el-hierro"],
  ["palma", "ibiza", "menorca"],
  ["olbia", "cagliari"],
  ["palermo", "catania"],
  ["heraklion", "chania"],
];
const clusterOf = (slug) => CLUSTERS.findIndex((c) => c.includes(slug));

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));

// ── Parse city centers from src/lib/cities.ts ───────────────────────────────
const citiesSrc = readFileSync(path.join(here, "..", "src", "lib", "cities.ts"), "utf8");
const re = /slug:\s*"([^"]+)"[\s\S]*?countryCode:\s*"([^"]+)"[\s\S]*?center:\s*\[\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\]/g;
const cities = [];
let m;
while ((m = re.exec(citiesSrc)) !== null) {
  cities.push({ slug: m[1], cc: m[2], lat: parseFloat(m[3]), lng: parseFloat(m[4]) });
}
const centerBySlug = new Map(cities.map((c) => [c.slug, c]));
const byCountry = {};
for (const c of cities) (byCountry[c.cc] ||= []).push(c);
console.log(`Parsed ${cities.length} city centers from cities.ts.`);

function km(aLat, aLng, bLat, bLng) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// ── Fetch all companies + primary locations ─────────────────────────────────
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function fetchAll(table, cols, filter) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(cols).range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) { console.error(table, "fetch failed:", error.message); process.exit(1); }
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

const companies = await fetchAll("companies", "id, slug, city, country");
const locs = await fetchAll("locations", "company_id, lat, lng", (q) => q.eq("is_primary", true));
const locByCompany = new Map(locs.map((l) => [l.company_id, l]));
console.log(`Companies: ${companies.length} | primary locations: ${locs.length}`);

// ── Audit ───────────────────────────────────────────────────────────────────
const moves = [];       // { id, slug, from, to, dFrom, dTo }
const farOrphans = [];  // far from assigned, but no nearby covered city
let noLoc = 0, noCenter = 0, ok = 0;

for (const co of companies) {
  const loc = locByCompany.get(co.id);
  if (!loc || loc.lat == null || loc.lng == null) { noLoc++; continue; }
  const assigned = centerBySlug.get(co.city);
  if (!assigned) { noCenter++; continue; }
  const dFrom = km(loc.lat, loc.lng, assigned.lat, assigned.lng);
  // nearest city in the same country
  let best = null, bestD = Infinity;
  for (const c of byCountry[co.country] || []) {
    const d = km(loc.lat, loc.lng, c.lat, c.lng);
    if (d < bestD) { bestD = d; best = c; }
  }
  if (dFrom <= FAR_KM) { ok++; continue; }
  const sameCluster = best && clusterOf(co.city) !== -1 && clusterOf(co.city) === clusterOf(best.slug);
  if (best && best.slug !== co.city && bestD < NEAR_KM && bestD < dFrom && !sameCluster) {
    moves.push({ id: co.id, slug: co.slug, from: co.city, to: best.slug, dFrom: Math.round(dFrom), dTo: Math.round(bestD) });
  } else {
    farOrphans.push({ slug: co.slug, from: co.city, dFrom: Math.round(dFrom), nearest: best?.slug, dNear: Math.round(bestD), protectedCluster: !!sameCluster });
  }
}

console.log(`\nWithin ${FAR_KM}km of assigned city (OK): ${ok}`);
console.log(`No location / no center: ${noLoc} / ${noCenter}`);
console.log(`Far from assigned but no nearby covered city (left as-is): ${farOrphans.length}`);
console.log(`\n=== Proposed moves: ${moves.length} ===`);
const byPair = {};
for (const mv of moves) { const k = `${mv.from} -> ${mv.to}`; (byPair[k] ||= []).push(mv); }
Object.entries(byPair).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => console.log(`  ${String(v.length).padStart(4)}  ${k}`));

if (farOrphans.length) {
  console.log(`\n=== Far orphans (>${FAR_KM}km, nearest covered city also far) — sample 20 ===`);
  const oByPair = {};
  for (const o of farOrphans) { const k = `${o.from} (nearest ${o.nearest} @${o.dNear}km)`; oByPair[k] = (oByPair[k] || 0) + 1; }
  Object.entries(oByPair).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));
}

if (APPLY && moves.length) {
  console.log(`\nApplying ${moves.length} city corrections...`);
  let done = 0;
  for (const mv of moves) {
    const { error } = await db.from("companies").update({ city: mv.to }).eq("id", mv.id);
    if (error) { console.error("update failed for", mv.slug, error.message); process.exit(1); }
    if (++done % 50 === 0) console.log(`  ${done}/${moves.length}`);
  }
  console.log(`✅  Applied ${done} corrections.`);
} else if (moves.length) {
  console.log(`\n(report only — re-run with --apply to write these ${moves.length} fixes)`);
}
