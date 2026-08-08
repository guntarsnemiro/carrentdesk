#!/usr/bin/env node
/**
 * Apply emails from docs/sales/email-scrape-results.csv to Supabase.
 * Only updates rows where status=found and email is currently empty.
 */
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

const rows = csvParse(fs.readFileSync(RESULTS, "utf8")).filter((r) => r.status === "found" && r.email_found);

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

let updated = 0;
for (const row of rows) {
  const res = await client.query(
    `update public.companies
     set email = $1
     where slug = $2 and (email is null or trim(email) = '')
     returning slug, email`,
    [row.email_found, row.slug]
  );
  if (res.rowCount) {
    updated++;
    console.log(`updated ${row.slug} -> ${row.email_found}`);
  } else {
    console.log(`skipped ${row.slug} (already has email)`);
  }
}

const { rows: totals } = await client.query(`
  select
    count(*)::int as total,
    count(*) filter (where email is not null and trim(email) <> '')::int as with_email
  from public.companies
`);
await client.end();

console.log(`\nUpdated ${updated} companies. DB now has ${totals[0].with_email} emails / ${totals[0].total} companies.`);
