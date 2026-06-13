import pg from "pg";
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query("select country, city, count(*)::int n from public.companies group by country, city order by country, n desc");
const t = await c.query("select count(*)::int n from public.companies");
await c.end();
let cur = "";
for (const row of r.rows) {
  if (row.country !== cur) { cur = row.country; console.log(`\n== ${cur} ==`); }
  console.log(`  ${row.city}: ${row.n}`);
}
console.log(`\nTOTAL companies: ${t.rows[0].n}`);
