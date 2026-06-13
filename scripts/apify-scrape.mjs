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
  // Montenegro — coast + capital
  montenegro: {
    countryCode: "me",
    queries: [
      "car rental Tivat", "rent a car Tivat", "car rental Tivat airport",
      "car rental Budva", "rent a car Budva", "car rental Kotor", "car rental Herceg Novi",
      "car rental Bar Montenegro", "car rental Ulcinj",
      "car rental Podgorica", "rent a car Podgorica", "car rental Podgorica airport",
    ],
  },
  // Albania — capital + riviera
  albania: {
    countryCode: "al",
    queries: [
      "car rental Tirana", "rent a car Tirana", "car rental Tirana airport",
      "car rental Saranda", "rent a car Saranda", "car rental Ksamil",
      "car rental Vlore", "car rental Vlora", "car rental Durres", "rent a car Durres",
    ],
  },
  // Italy south + Tuscany + Veneto — new cities + boost Naples/Rome/Catania
  "italy-south": {
    countryCode: "it",
    queries: [
      "car rental Bari", "autonoleggio Bari", "car rental Bari airport",
      "car rental Brindisi", "car rental Brindisi airport",
      "car rental Pisa", "car rental Pisa airport",
      "car rental Florence", "autonoleggio Firenze", "car rental Florence airport",
      "car rental Venice", "autonoleggio Venezia", "car rental Venice airport", "car rental Venice Mestre",
      "car rental Naples", "autonoleggio Napoli", "car rental Naples airport",
      "car rental Rome", "car rental Rome Fiumicino airport",
      "car rental Catania", "car rental Catania airport",
    ],
  },
  // Cleanup — Azores (Portugal islands)
  azores: {
    countryCode: "pt",
    queries: [
      "car rental Ponta Delgada", "rent a car Ponta Delgada", "car rental Ponta Delgada airport",
      "car rental Sao Miguel Azores", "rent a car Azores", "aluguer de carros Ponta Delgada",
    ],
  },
  // Cleanup — more Greek islands + boost Rhodes/Zakynthos
  "greek-islands-2": {
    countryCode: "gr",
    queries: [
      "car rental Kefalonia", "car rental Kefalonia airport", "car rental Argostoli",
      "car rental Naxos", "rent a car Naxos",
      "car rental Paros", "rent a car Paros",
      "car rental Rhodes", "car rental Rhodes airport", "rent a car Rhodes",
      "car rental Zakynthos", "car rental Zakynthos airport", "rent a car Zante",
    ],
  },
  // Bulgaria — Black Sea coast + capital
  bulgaria: {
    countryCode: "bg",
    queries: [
      "car rental Sofia", "rent a car Sofia", "car rental Sofia airport",
      "car rental Varna", "rent a car Varna", "car rental Varna airport", "car rental Golden Sands",
      "car rental Burgas", "rent a car Burgas", "car rental Burgas airport", "car rental Sunny Beach", "car rental Nessebar",
      "car rental Plovdiv",
    ],
  },
  // Spain mainland coast — new cities + boost existing
  "spain-mainland": {
    countryCode: "es",
    queries: [
      "car rental Valencia", "alquiler de coches Valencia", "car rental Valencia airport",
      "car rental Seville", "alquiler de coches Sevilla", "car rental Seville airport",
      "car rental Bilbao", "alquiler de coches Bilbao", "car rental Bilbao airport",
      "car rental Girona", "car rental Girona airport", "car rental Costa Brava", "car rental Lloret de Mar",
      "car rental Barcelona", "alquiler de coches Barcelona", "car rental Barcelona airport",
      "car rental Madrid", "alquiler de coches Madrid", "car rental Madrid airport",
      "car rental Malaga", "car rental Malaga airport",
      "car rental Alicante", "car rental Alicante airport",
    ],
  },
  // France — Corsica + Cote d'Azur + majors
  france: {
    countryCode: "fr",
    queries: [
      "car rental Nice", "location de voiture Nice", "car rental Nice airport", "car rental Cannes", "car rental Antibes",
      "car rental Ajaccio", "location de voiture Ajaccio", "car rental Ajaccio airport", "car rental Porto-Vecchio",
      "car rental Bastia", "car rental Bastia airport", "car rental Calvi",
      "car rental Marseille", "location de voiture Marseille", "car rental Marseille airport", "car rental Aix-en-Provence",
      "car rental Bordeaux", "location de voiture Bordeaux", "car rental Bordeaux airport",
      "car rental Paris", "location de voiture Paris", "car rental Paris CDG airport", "car rental Paris Orly airport",
      "car rental Lyon", "location de voiture Lyon", "car rental Lyon airport",
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
