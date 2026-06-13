#!/usr/bin/env node
/**
 * Full per-city sanity report over every company:
 *  - distance distribution of each city's pins from its center (are they really there?)
 *  - duplicate detection by phone and by website host (inflated counts?)
 *  - optional deep-dive bounding-box check for a given city (--city=heraklion)
 *
 *   node --env-file=.env.local scripts/audit-cities.mjs
 *   node --env-file=.env.local scripts/audit-cities.mjs --city=rhodes
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const focus = (process.argv.find((a) => a.startsWith("--city=")) || "").split("=")[1];

const citiesSrc = readFileSync(path.join(here, "..", "src", "lib", "cities.ts"), "utf8");
const re = /slug:\s*"([^"]+)"[\s\S]*?countryCode:\s*"([^"]+)"[\s\S]*?center:\s*\[\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\]/g;
const centerBySlug = new Map();
let m;
while ((m = re.exec(citiesSrc)) !== null) centerBySlug.set(m[1], { cc: m[2], lat: parseFloat(m[3]), lng: parseFloat(m[4]) });

function km(aLat, aLng, bLat, bLng) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function fetchAll(table, cols, filter) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(cols).range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) { console.error(table, error.message); process.exit(1); }
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

const companies = await fetchAll("companies", "id, slug, name, city, country, phone, website");
const locs = await fetchAll("locations", "company_id, lat, lng", (q) => q.eq("is_primary", true));
const locBy = new Map(locs.map((l) => [l.company_id, l]));

// ── Per-city distance distribution ──────────────────────────────────────────
const stat = {};
for (const co of companies) {
  const s = (stat[co.city] ||= { n: 0, w20: 0, w40: 0, w60: 0, beyond: 0, max: 0, noloc: 0 });
  s.n++;
  const loc = locBy.get(co.id);
  const c = centerBySlug.get(co.city);
  if (!loc || loc.lat == null || !c) { s.noloc++; continue; }
  const d = km(loc.lat, loc.lng, c.lat, c.lng);
  if (d <= 20) s.w20++; else if (d <= 40) s.w40++; else if (d <= 60) s.w60++; else s.beyond++;
  if (d > s.max) s.max = d;
}

console.log("city          total  <=20  21-40 41-60  >60  maxKm  noloc");
Object.entries(stat).sort((a, b) => b[1].n - a[1].n).forEach(([slug, s]) => {
  const flag = s.beyond > 0 ? "  <-- has pins >60km" : "";
  console.log(
    slug.padEnd(14) + String(s.n).padStart(5) + String(s.w20).padStart(6) + String(s.w40).padStart(6) +
    String(s.w60).padStart(6) + String(s.beyond).padStart(5) + String(Math.round(s.max)).padStart(7) + String(s.noloc).padStart(7) + flag
  );
});

// ── Duplicate detection ─────────────────────────────────────────────────────
const byPhone = {}, byHost = {};
const digits = (p) => (p || "").replace(/\D/g, "").replace(/^00/, "");
const host = (w) => { try { return new URL(w).host.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
for (const co of companies) {
  const p = digits(co.phone); if (p && p.length >= 7) (byPhone[p] ||= []).push(co);
  const h = host(co.website); if (h) (byHost[h] ||= []).push(co);
}
const dupPhones = Object.entries(byPhone).filter(([, v]) => v.length > 1);
const dupHosts = Object.entries(byHost).filter(([, v]) => v.length > 1);
console.log(`\nDuplicate phone groups: ${dupPhones.length} (covering ${dupPhones.reduce((a, [, v]) => a + v.length, 0)} companies)`);
console.log(`Duplicate website-host groups: ${dupHosts.length} (covering ${dupHosts.reduce((a, [, v]) => a + v.length, 0)} companies)`);
dupPhones.slice(0, 10).forEach(([p, v]) => console.log(`  phone ${p}: ${v.map((c) => c.slug + "[" + c.city + "]").join(", ")}`));
dupHosts.slice(0, 10).forEach(([h, v]) => console.log(`  site ${h}: ${v.map((c) => c.slug + "[" + c.city + "]").join(", ")}`));

// ── Optional deep dive ──────────────────────────────────────────────────────
if (focus) {
  const c = centerBySlug.get(focus);
  console.log(`\n=== Deep dive: ${focus} (center ${c.lat},${c.lng}) ===`);
  const rows = companies.filter((co) => co.city === focus).map((co) => {
    const loc = locBy.get(co.id);
    return { name: co.name, lat: loc?.lat, lng: loc?.lng, d: loc ? Math.round(km(loc.lat, loc.lng, c.lat, c.lng)) : null };
  }).sort((a, b) => (b.d ?? 0) - (a.d ?? 0));
  console.log("Farthest 15 from center:");
  rows.slice(0, 15).forEach((r) => console.log(`  ${String(r.d).padStart(4)}km  ${r.lat?.toFixed(3)},${r.lng?.toFixed(3)}  ${r.name}`));
}
