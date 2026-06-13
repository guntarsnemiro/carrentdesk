#!/usr/bin/env node
/**
 * Targeted correctness fixes the nearest-center geo-audit can't safely make:
 *  1. Remove true duplicate listings (same phone+city OR same website-host+city).
 *  2. Re-route island companies by COORDINATE BOUNDING BOX (no center-distance
 *     false positives): Canaries, Balearics, Azores, Crete, Dalmatian coast.
 *
 *   node --env-file=.env.local scripts/fix-outliers.mjs           # report
 *   node --env-file=.env.local scripts/fix-outliers.mjs --apply   # write
 */
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function fetchAll(table, cols, filter) { const out = []; for (let f = 0; ; f += 1000) { let q = db.from(table).select(cols).range(f, f + 999); if (filter) q = filter(q); const { data, error } = await q; if (error) { console.error(error.message); process.exit(1); } out.push(...data); if (data.length < 1000) break; } return out; }
const km = (a, b, c, d) => { const R = 6371, r = (x) => x * Math.PI / 180; const dLat = r(c - a), dLng = r(d - b); const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };

const companies = await fetchAll("companies", "id, slug, name, city, country, phone, website, status");
const locs = await fetchAll("locations", "company_id, lat, lng", (q) => q.eq("is_primary", true));
const locBy = new Map(locs.map((l) => [l.company_id, l]));

// ── 1. True duplicates ──────────────────────────────────────────────────────
const digits = (p) => (p || "").replace(/\D/g, "").replace(/^00/, "");
const host = (w) => { try { return new URL(w).host.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const groups = {};
for (const co of companies) { const p = digits(co.phone); if (p && p.length >= 7) (groups[`p:${p}|${co.city}`] ||= []).push(co); }
for (const co of companies) { const h = host(co.website); if (h) (groups[`h:${h}|${co.city}`] ||= []).push(co); }
const extras = new Set(), kept = new Set();
for (const [, v] of Object.entries(groups)) {
  if (v.length < 2) continue;
  const sorted = [...v].sort((a, b) => ((b.status === "claimed") - (a.status === "claimed")) || (a.slug.length - b.slug.length));
  kept.add(sorted[0].id);
  for (let i = 1; i < sorted.length; i++) if (!kept.has(sorted[i].id)) extras.add(sorted[i].id);
}

// ── 2. Coordinate bounding boxes ────────────────────────────────────────────
const inBox = (lat, lng, latMin, latMax, lngMin, lngMax) => lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
function canary(lat, lng) {
  if (inBox(lat, lng, 28.78, 29.5, -13.95, -13.33)) return "lanzarote";
  if (inBox(lat, lng, 27.95, 28.85, -14.65, -13.75)) return "fuerteventura";
  if (inBox(lat, lng, 27.70, 28.25, -15.95, -15.30)) return "gran-canaria";
  if (inBox(lat, lng, 27.95, 28.65, -16.95, -16.05)) return "tenerife";
  if (inBox(lat, lng, 27.95, 28.30, -17.45, -17.00)) return "la-gomera";
  if (inBox(lat, lng, 28.40, 28.90, -18.05, -17.65)) return "la-palma";
  if (inBox(lat, lng, 27.60, 27.92, -18.20, -17.85)) return "el-hierro";
  return null;
}
function balearic(lat, lng) {
  if (inBox(lat, lng, 39.75, 40.10, 3.75, 4.40)) return "menorca";
  if (inBox(lat, lng, 38.55, 39.12, 1.15, 1.70)) return "ibiza";
  if (inBox(lat, lng, 39.20, 40.00, 2.20, 3.55)) return "palma";
  return null;
}
const CANARY = new Set(["tenerife", "gran-canaria", "lanzarote", "fuerteventura", "la-palma", "la-gomera", "el-hierro"]);
const BALEARIC = new Set(["palma", "ibiza", "menorca"]);
const HR_COAST = [["split", 43.5081, 16.4402], ["dubrovnik", 42.6507, 18.0944], ["zadar", 44.1194, 15.2314], ["rijeka", 45.3271, 14.4422], ["pula", 44.8666, 13.8496]];

const moves = []; // {id, name, from, to, reason}
for (const co of companies) {
  if (extras.has(co.id)) continue;
  const l = locBy.get(co.id);
  if (!l || l.lat == null) continue;
  let to = null, reason = "";
  if (co.country === "ES" && CANARY.has(co.city)) { const b = canary(l.lat, l.lng); if (b && b !== co.city) { to = b; reason = "canary-box"; } }
  else if (co.country === "ES" && BALEARIC.has(co.city)) { const b = balearic(l.lat, l.lng); if (b && b !== co.city) { to = b; reason = "balearic-box"; } }
  else if (co.country === "PT" && l.lng < -24 && co.city !== "ponta-delgada") { to = "ponta-delgada"; reason = "azores"; }
  else if (co.country === "PT" && inBox(l.lat, l.lng, 32.40, 33.20, -17.40, -16.10) && co.city !== "funchal") { to = "funchal"; reason = "madeira"; }
  else if (co.country === "GR" && co.city === "athens" && inBox(l.lat, l.lng, 34.70, 35.80, 23.30, 26.50)) { to = l.lng < 24.5 ? "chania" : "heraklion"; reason = "crete"; }
  else if (co.country === "HR" && co.city === "zagreb" && (inBox(l.lat, l.lng, 42.0, 44.6, 13.4, 18.6) || (l.lng < 15.0 && l.lat < 45.65))) {
    let best = null, bd = Infinity; for (const [s, la, ln] of HR_COAST) { const d = km(l.lat, l.lng, la, ln); if (d < bd) { bd = d; best = s; } }
    if (best && bd < 120) { to = best; reason = `hr-coast(${Math.round(bd)}km)`; }
  }
  if (to) moves.push({ id: co.id, name: co.name, from: co.city, to, reason });
}

// ── Report ──────────────────────────────────────────────────────────────────
const pair = {};
for (const mv of moves) { const k = `${mv.from} -> ${mv.to} [${mv.reason.replace(/\(.*/, "")}]`; pair[k] = (pair[k] || 0) + 1; }
console.log(`=== Duplicate removals: ${extras.size} ===`);
const exByCity = {}; for (const co of companies) if (extras.has(co.id)) exByCity[co.city] = (exByCity[co.city] || 0) + 1;
Object.entries(exByCity).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${String(v).padStart(3)}  ${k}`));
console.log(`\n=== Coordinate-box re-routes: ${moves.length} ===`);
Object.entries(pair).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${String(v).padStart(3)}  ${k}`));

if (APPLY) {
  if (extras.size) {
    const ids = [...extras];
    for (let i = 0; i < ids.length; i += 100) { const s = ids.slice(i, i + 100); await db.from("locations").delete().in("company_id", s); }
    for (let i = 0; i < ids.length; i += 100) { const s = ids.slice(i, i + 100); const { error } = await db.from("companies").delete().in("id", s); if (error) { console.error("delete failed:", error.message); process.exit(1); } }
    console.log(`\n✅  Deleted ${extras.size} duplicate companies (+ their locations).`);
  }
  let done = 0;
  for (const mv of moves) { const { error } = await db.from("companies").update({ city: mv.to }).eq("id", mv.id); if (error) { console.error("update failed:", error.message); process.exit(1); } done++; }
  console.log(`✅  Re-routed ${done} companies.`);
} else {
  console.log("\n(report only — re-run with --apply to write)");
}
