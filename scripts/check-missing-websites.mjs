#!/usr/bin/env node
/** Compare top no-website scrape misses against DB fields. */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const RESULTS = path.join(ROOT, "..", "docs", "sales", "email-scrape-results.csv");

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

loadEnvLocal();
const noWebsite = csvParse(fs.readFileSync(RESULTS, "utf8"))
  .filter((r) => r.status === "no_website")
  .map((r) => r.slug);

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const { rows } = await client.query(
  `select slug, name, phone, website, google_url, email
   from public.companies
   where slug = any($1::text[])
   order by slug`,
  [noWebsite]
);

console.log(`Checked ${noWebsite.length} slugs marked no_website in scrape.\n`);
for (const slug of noWebsite) {
  const r = rows.find((x) => x.slug === slug);
  if (!r) { console.log(`${slug}: MISSING FROM DB`); continue; }
  const w = r.website?.trim() || "";
  const g = r.google_url?.trim() || "";
  console.log(`${slug}`);
  console.log(`  name: ${r.name}`);
  console.log(`  phone: ${r.phone || "(none)"}`);
  console.log(`  website: ${w || "(empty)"}`);
  console.log(`  google_url: ${g ? g.slice(0, 80) + "..." : "(empty)"}`);
  console.log(`  email: ${r.email || "(empty)"}`);
}

await client.end();
