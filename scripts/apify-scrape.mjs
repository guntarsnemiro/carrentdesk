#!/usr/bin/env node
/**
 * Runs the Apify Google Maps Scraper for all target cities (English + local
 * language queries) and saves the raw output to scripts/raw/gmaps-rentals.json
 *
 * Prerequisites:
 *   1. Set APIFY_TOKEN in your .env.local  (or pass as env variable)
 *   2. npm install -g dotenv  (or run with: node --env-file=.env.local scripts/apify-scrape.mjs)
 *
 * Usage:
 *   node --env-file=.env.local scripts/apify-scrape.mjs
 *
 * After this completes, run:
 *   node scripts/seed-from-gmaps.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  console.error("❌  APIFY_TOKEN not set. Add it to .env.local");
  process.exit(1);
}

// Apify actor: compass/crawler-google-places (Google Maps Scraper)
const ACTOR_ID = "compass~crawler-google-places";

// All search queries — English + local language for each city.
// This run targets the Southern Europe expansion (ES, PT, IT, GR, HR).
// To refresh Northern Europe instead, swap in the previous query set.
const SEARCH_QUERIES = [
  // ── Spain ────────────────────────────────────────────────────────
  "car rental Madrid",
  "alquiler de coches Madrid",
  "car rental Madrid airport",
  "car rental Barcelona",
  "alquiler de coches Barcelona",
  "car rental Barcelona airport",
  "car rental Malaga",
  "alquiler de coches Málaga",
  "car rental Malaga airport",
  "car rental Palma de Mallorca",
  "alquiler de coches Palma de Mallorca",
  "car rental Mallorca airport",
  "car rental Alicante",
  "alquiler de coches Alicante",
  "car rental Alicante airport",

  // ── Portugal ─────────────────────────────────────────────────────
  "car rental Lisbon",
  "aluguer de carros Lisboa",
  "car rental Lisbon airport",
  "car rental Porto",
  "aluguer de carros Porto",
  "car rental Porto airport",
  "car rental Faro",
  "aluguer de carros Faro",
  "car rental Faro airport Algarve",

  // ── Italy ────────────────────────────────────────────────────────
  "car rental Rome",
  "autonoleggio Roma",
  "car rental Rome Fiumicino airport",
  "car rental Milan",
  "autonoleggio Milano",
  "car rental Milan Malpensa airport",
  "car rental Naples",
  "autonoleggio Napoli",
  "car rental Naples airport",
  "car rental Catania",
  "autonoleggio Catania",
  "car rental Catania airport",

  // ── Greece ───────────────────────────────────────────────────────
  "car rental Athens",
  "ενοικιάσεις αυτοκινήτων Αθήνα",
  "car rental Athens airport",
  "car rental Heraklion Crete",
  "ενοικιάσεις αυτοκινήτων Ηράκλειο",
  "car rental Heraklion airport",
  "car rental Thessaloniki",
  "car rental Thessaloniki airport",
  "car rental Rhodes",
  "car rental Rhodes airport",

  // ── Croatia ──────────────────────────────────────────────────────
  "rent a car Split",
  "najam automobila Split",
  "car rental Split airport",
  "rent a car Dubrovnik",
  "car rental Dubrovnik airport",
  "rent a car Zagreb",
  "najam automobila Zagreb",
  "car rental Zagreb airport",
  "rent a car Zadar",
  "car rental Zadar airport",
];

const ACTOR_INPUT = {
  searchStringsArray: SEARCH_QUERIES,
  language: "en",          // UI language — results still include native listings
  maxCrawledPlacesPerSearch: 60,
  includeHistogram: false,
  includeOpeningHours: false,
  includePeopleAlsoSearch: false,
  maxReviews: 0,           // skip fetching individual reviews (faster + cheaper)
  exportPlaceUrls: false,
  additionalInfo: false,
  scrapeDirectories: false,
};

const BASE = "https://api.apify.com/v2";

async function apify(method, path, body) {
  const res = await fetch(`${BASE}${path}?token=${APIFY_TOKEN}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`🚀  Starting Apify run with ${SEARCH_QUERIES.length} search queries…`);
  console.log(`    Actor: ${ACTOR_ID}`);
  console.log(`    Queries:\n${SEARCH_QUERIES.map((q) => `      · ${q}`).join("\n")}\n`);

  // 1. Start the actor run
  const { data: run } = await apify("POST", `/acts/${ACTOR_ID}/runs`, {
    ...ACTOR_INPUT,
  });
  const runId = run.id;
  console.log(`▶  Run started: ${runId}`);
  console.log(`   https://console.apify.com/actors/runs/${runId}\n`);

  // 2. Poll until finished
  let status = run.status;
  let dots = 0;
  while (status === "RUNNING" || status === "READY" || status === "PENDING") {
    await sleep(15_000);
    const { data: info } = await apify("GET", `/acts/${ACTOR_ID}/runs/${runId}`);
    status = info.status;
    process.stdout.write(`\r⏳  ${status}${"·".repeat((dots++ % 3) + 1)}   `);
  }
  console.log(`\n\n✅  Run finished with status: ${status}`);

  if (status !== "SUCCEEDED") {
    console.error("❌  Run did not succeed. Check Apify console for details.");
    process.exit(1);
  }

  // 3. Download dataset
  const datasetId = run.defaultDatasetId;
  console.log(`📥  Downloading dataset ${datasetId}…`);
  const res = await fetch(
    `${BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&clean=true`
  );
  if (!res.ok) throw new Error(`Failed to download dataset: ${res.status}`);
  const items = await res.json();
  console.log(`    Downloaded ${items.length} records.`);

  // 4. Save to scripts/raw/gmaps-rentals.json
  const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
  const rawDir = path.join(here, "raw");
  mkdirSync(rawDir, { recursive: true });
  const outPath = path.join(rawDir, "gmaps-rentals.json");
  writeFileSync(outPath, JSON.stringify(items, null, 2));
  console.log(`💾  Saved → ${outPath}`);
  console.log(`\n🎯  Next step: node scripts/seed-from-gmaps.mjs`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
