#!/usr/bin/env node
/**
 * Backfill companies.website from Apify GMaps JSON exports (match by phone).
 *
 * Usage:
 *   node scripts/backfill-websites-from-gmaps.mjs              # dry run, top-50 no-website
 *   node scripts/backfill-websites-from-gmaps.mjs --apply      # write to DB
 *   node scripts/backfill-websites-from-gmaps.mjs --all        # all DB rows missing website
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const RAW_DIR = path.join(ROOT, "raw");
const SCRAPE_RESULTS = path.join(ROOT, "..", "docs", "sales", "email-scrape-results.csv");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const allMissing = args.includes("--all");

function loadEnvLocal() {
  const envPath = path.join(ROOT, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim().replace(/^\uFEFF/, "");
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function phoneKey(p) {
  if (!p) return null;
  const d = String(p).replace(/\D/g, "");
  return d.length >= 8 ? d : null;
}

function pickWebsite(record) {
  if (!record.website) return null;
  try {
    const u = new URL(record.website);
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return record.website;
  }
}

function csvParse(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = (cols[i] ?? "").trim(); });
    return row;
  });
}

function loadGmapsIndex() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.startsWith("gmaps-rentals") && f.endsWith(".json"));
  const byPhone = new Map();
  let records = 0;
  let withWebsite = 0;

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), "utf8"));
    for (const r of raw) {
      records++;
      const phone = phoneKey(r.phoneUnformatted || r.phone);
      const website = pickWebsite(r);
      if (!phone || !website) continue;
      withWebsite++;
      if (!byPhone.has(phone)) {
        byPhone.set(phone, { website, title: r.title, source: file });
      }
    }
  }

  console.log(`GMaps index: ${files.length} files, ${records} records, ${withWebsite} with phone+website, ${byPhone.size} unique phones\n`);
  return byPhone;
}

loadEnvLocal();
const gmaps = loadGmapsIndex();

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

let targets;
if (allMissing) {
  const { rows } = await client.query(
    `select slug, name, phone, website from public.companies
     where website is null or trim(website) = ''
     order by slug`
  );
  targets = rows;
} else {
  const slugs = csvParse(fs.readFileSync(SCRAPE_RESULTS, "utf8"))
    .filter((r) => r.status === "no_website")
    .map((r) => r.slug);
  const { rows } = await client.query(
    `select slug, name, phone, website from public.companies where slug = any($1::text[])`,
    [slugs]
  );
  targets = rows;
}

const matched = [];
const unmatched = [];

for (const co of targets) {
  const pk = phoneKey(co.phone);
  const hit = pk ? gmaps.get(pk) : null;
  if (hit) {
    matched.push({ ...co, gmaps_website: hit.website, gmaps_title: hit.title, gmaps_source: hit.source });
  } else {
    unmatched.push(co);
  }
}

console.log(`Targets: ${targets.length} companies without website`);
console.log(`Matched in GMaps by phone: ${matched.length}`);
console.log(`Not in GMaps export: ${unmatched.length}\n`);

for (const m of matched) {
  console.log(`${m.slug}`);
  console.log(`  DB name:    ${m.name}`);
  console.log(`  GMaps name: ${m.gmaps_title}`);
  console.log(`  phone:      ${m.phone}`);
  console.log(`  website:    ${m.gmaps_website}  (${m.gmaps_source})`);
}

if (matched.length && !apply) {
  console.log(`\nDry run — re-run with --apply to update ${matched.length} rows.`);
}

if (apply && matched.length) {
  let updated = 0;
  for (const m of matched) {
    const res = await client.query(
      `update public.companies set website = $1
       where slug = $2 and (website is null or trim(website) = '')
       returning slug`,
      [m.gmaps_website, m.slug]
    );
    if (res.rowCount) updated++;
  }
  console.log(`\nApplied ${updated} website updates.`);
}

if (unmatched.length) {
  console.log(`\n--- Not found in GMaps (${unmatched.length}) ---`);
  for (const u of unmatched.slice(0, 15)) {
    console.log(`  ${u.slug} (${u.phone || "no phone"})`);
  }
  if (unmatched.length > 15) console.log(`  ... and ${unmatched.length - 15} more`);
}

await client.end();
