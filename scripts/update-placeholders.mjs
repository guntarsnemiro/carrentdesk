import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query("select city, count(*)::int n from public.companies group by city");
await c.end();
const counts = new Map(r.rows.map((x) => [x.city, x.n]));

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const file = path.join(here, "..", "src", "lib", "cities.ts");
let src = readFileSync(file, "utf8");

let updated = 0;
for (const [slug, n] of counts) {
  const re = new RegExp(`(slug: "${slug}",[\\s\\S]*?placeholderCount: )\\d+`);
  if (re.test(src)) {
    src = src.replace(re, `$1${n}`);
    updated++;
  } else {
    console.log(`  (no city entry for slug "${slug}" — skipped, ${n} listings)`);
  }
}

writeFileSync(file, src);
console.log(`Updated ${updated} placeholderCounts. Total listings: ${[...counts.values()].reduce((a, b) => a + b, 0)}`);
