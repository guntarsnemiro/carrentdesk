#!/usr/bin/env node
/**
 * Dumps existing company identity keys (slug, phone, website) from the DB to
 * scripts/raw/existing-keys.json so the seed step can dedupe new/re-run batches
 * against everything already loaded — by phone/website (stable) AND slug.
 *
 *   node --env-file=.env.local scripts/dump-slugs.mjs
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query("select slug, phone, website from public.companies");
await c.end();

const keys = {
  slugs: r.rows.map((x) => x.slug),
  phones: r.rows.map((x) => x.phone).filter(Boolean),
  websites: r.rows.map((x) => x.website).filter(Boolean),
};

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const out = path.join(here, "raw", "existing-keys.json");
writeFileSync(out, JSON.stringify(keys, null, 2));
console.log(`Wrote ${keys.slugs.length} slugs, ${keys.phones.length} phones, ${keys.websites.length} websites → ${out}`);
