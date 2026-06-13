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

// ── Batches ─────────────────────────────────────────────────────────
// Each batch is ONE country so we can geo-constrain the whole run with
// `countryCode` (the actor scopes all searches to that country). This kills
// the wrong-country waste we saw last time (Naples FL, Milan US, etc.) and
// keeps cost/quality controllable — run one batch, review, then the next.
//
// Pick a batch with:  APIFY_BATCH=canaries node --env-file=.env.local scripts/apify-scrape.mjs
//
// Tier-1 island expansion. Local-language + English + airport per island.
const BATCHES = {
  // Spain — Canary Islands + Ibiza
  canaries: {
    countryCode: "es",
    queries: [
      "car rental Tenerife", "alquiler de coches Tenerife", "car rental Tenerife South airport", "car rental Tenerife North airport",
      "car rental Gran Canaria", "alquiler de coches Gran Canaria", "car rental Las Palmas airport",
      "car rental Lanzarote", "alquiler de coches Lanzarote", "car rental Lanzarote airport",
      "car rental Fuerteventura", "alquiler de coches Fuerteventura", "car rental Fuerteventura airport",
      "car rental Ibiza", "alquiler de coches Ibiza", "car rental Ibiza airport",
    ],
  },
  // Portugal — Madeira
  madeira: {
    countryCode: "pt",
    queries: [
      "car rental Funchal Madeira", "aluguer de carros Funchal", "aluguer de carros Madeira", "car rental Madeira airport",
    ],
  },
  // Italy — Sardinia + Sicily
  "sardinia-sicily": {
    countryCode: "it",
    queries: [
      "car rental Olbia", "autonoleggio Olbia", "car rental Olbia airport Costa Smeralda",
      "car rental Cagliari", "autonoleggio Cagliari", "car rental Cagliari airport",
      "car rental Palermo", "autonoleggio Palermo", "car rental Palermo airport",
    ],
  },
  // Greece — islands
  "greek-islands": {
    countryCode: "gr",
    queries: [
      "car rental Corfu", "ενοικιάσεις αυτοκινήτων Κέρκυρα", "car rental Corfu airport",
      "car rental Santorini", "car rental Santorini airport",
      "car rental Mykonos", "car rental Mykonos airport",
      "car rental Kos", "car rental Kos airport",
      "car rental Zakynthos", "car rental Zakynthos airport",
      "car rental Chania Crete", "ενοικιάσεις αυτοκινήτων Χανιά", "car rental Chania airport",
    ],
  },
  // Cyprus
  cyprus: {
    countryCode: "cy",
    queries: [
      "car rental Larnaca", "car rental Larnaca airport",
      "car rental Paphos", "car rental Paphos airport",
      "car rental Cyprus",
    ],
  },
  // Malta
  malta: {
    countryCode: "mt",
    queries: [
      "car rental Malta", "car rental Malta airport", "car hire Malta",
    ],
  },
  // Croatia — boost existing coast + add Istria/Kvarner (Pula, Rijeka)
  croatia: {
    countryCode: "hr",
    queries: [
      "car rental Dubrovnik", "rent a car Dubrovnik", "car rental Dubrovnik airport",
      "car rental Split", "rent a car Split", "car rental Split airport",
      "car rental Zadar", "rent a car Zadar", "car rental Zadar airport",
      "car rental Zagreb", "rent a car Zagreb", "car rental Zagreb airport",
      "car rental Pula", "rent a car Pula", "car rental Pula airport", "car rental Rovinj", "car rental Porec",
      "car rental Rijeka", "rent a car Rijeka", "car rental Opatija", "car rental Krk airport",
    ],
  },
  // Slovenia
  slovenia: {
    countryCode: "si",
    queries: [
      "car rental Ljubljana", "najem avtomobila Ljubljana", "car rental Ljubljana airport",
      "car rental Koper", "car rental Portoroz", "car rental Piran", "car rental Maribor",
    ],
  },
};

const BATCH = process.env.APIFY_BATCH || "canaries";
const selected = BATCHES[BATCH];
if (!selected) {
  console.error(`❌  Unknown batch "${BATCH}". Available: ${Object.keys(BATCHES).join(", ")}`);
  process.exit(1);
}
const SEARCH_QUERIES = selected.queries;

const ACTOR_INPUT = {
  searchStringsArray: SEARCH_QUERIES,
  countryCode: selected.countryCode,   // geo-scope the whole run to one country
  language: "en",          // UI language — results still include native listings
  maxCrawledPlacesPerSearch: parseInt(process.env.APIFY_MAX || "120", 10), // per-search cap (~Google's practical ceiling; override with APIFY_MAX)
  includeHistogram: false,
  includeOpeningHours: false,
  includePeopleAlsoSearch: false,
  maxReviews: 0,           // skip fetching individual reviews (faster + cheaper)
  scrapePlaceDetailPage: false, // keep us on the cheap $/1k base tier
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
  console.log(`🚀  Starting Apify run — batch "${BATCH}" (countryCode: ${selected.countryCode}) with ${SEARCH_QUERIES.length} queries…`);
  console.log(`    Actor: ${ACTOR_ID}`);
  console.log(`    Cap: ${ACTOR_INPUT.maxCrawledPlacesPerSearch}/search · est. max ${SEARCH_QUERIES.length * ACTOR_INPUT.maxCrawledPlacesPerSearch} results`);
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
  // Canonical file the seed script reads, plus a per-batch archive copy.
  const outPath = path.join(rawDir, "gmaps-rentals.json");
  const archivePath = path.join(rawDir, `gmaps-rentals-${BATCH}.json`);
  writeFileSync(outPath, JSON.stringify(items, null, 2));
  writeFileSync(archivePath, JSON.stringify(items, null, 2));
  console.log(`💾  Saved → ${outPath}`);
  console.log(`💾  Archive → ${archivePath}`);
  console.log(`\n🎯  Next step: node scripts/seed-from-gmaps.mjs   (then load into Supabase)`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
