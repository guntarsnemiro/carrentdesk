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
// Weak cities (Bergen 1, Stockholm 4, Aarhus 3, Copenhagen 5, Helsinki 5)
// get extra query variants to surface more independents.
const SEARCH_QUERIES = [
  // ── Baltics (refresh ratings only) ───────────────────────────────
  "car rental Riga",
  "auto noma Rīga",
  "car rental Tallinn",
  "autorent Tallinn",
  "car rental Vilnius",
  "automobiliu nuoma Vilnius",
  "car rental Kaunas",
  "car rental Pärnu",

  // ── Sweden ───────────────────────────────────────────────────────
  // Stockholm — currently only 4 listings, push hard
  "car rental Stockholm",
  "biluthyrning Stockholm",
  "hyr bil Stockholm",
  "biluthyrning Arlanda",
  "car rental Stockholm airport",
  // Gothenburg
  "car rental Gothenburg",
  "biluthyrning Göteborg",
  "hyr bil Göteborg",
  // Malmö
  "car rental Malmö",
  "biluthyrning Malmö",

  // ── Norway ───────────────────────────────────────────────────────
  // Oslo
  "car rental Oslo",
  "bilutleie Oslo",
  "leiebil Oslo",
  "car rental Oslo airport",
  "bilutleie Gardermoen",
  // Bergen — currently only 1 listing, many extra queries
  "car rental Bergen",
  "bilutleie Bergen",
  "leiebil Bergen",
  "car rental Bergen airport",
  "bilutleie Flesland",
  "leiebil Flesland",
  // Stavanger — new city
  "car rental Stavanger",
  "bilutleie Stavanger",
  "leiebil Stavanger",
  "car rental Sola airport",
  // Trondheim — new city
  "car rental Trondheim",
  "bilutleie Trondheim",
  "leiebil Trondheim",
  "car rental Trondheim airport",
  // Tromsø — new city
  "car rental Tromsø",
  "bilutleie Tromsø",
  "leiebil Tromsø",
  "car rental Tromso",

  // ── Denmark ──────────────────────────────────────────────────────
  // Copenhagen — currently only 5
  "car rental Copenhagen",
  "biludlejning København",
  "biludlejning Kastrup",
  "car rental Copenhagen airport",
  "lejebil København",
  // Aarhus — currently only 3
  "car rental Aarhus",
  "biludlejning Aarhus",
  "lejebil Aarhus",
  // Odense — new city
  "car rental Odense",
  "biludlejning Odense",
  "lejebil Odense",

  // ── Finland ──────────────────────────────────────────────────────
  // Helsinki — currently only 5
  "car rental Helsinki",
  "autonvuokraus Helsinki",
  "car rental Helsinki airport",
  "autonvuokraus Vantaa",
  "vuokra-auto Helsinki",
  // Tampere
  "car rental Tampere",
  "autonvuokraus Tampere",
  "vuokra-auto Tampere",
  // Turku — new city
  "car rental Turku",
  "autonvuokraus Turku",
  "vuokra-auto Turku",

  // ── Iceland ──────────────────────────────────────────────────────
  // Reykjavik — already strong (17), but refresh
  "car rental Reykjavik",
  "bílaleiga Reykjavík",
  "car rental Keflavik airport",
  // Akureyri — new city, small market but high intent
  "car rental Akureyri",
  "bílaleiga Akureyri",
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
