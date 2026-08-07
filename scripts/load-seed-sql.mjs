#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const sqlPath = process.argv[2] || path.join("scripts", "raw", "listings-seed.sql");
const sql = fs.readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const before = await client.query("select count(*)::int as n from companies where country = 'AT'");
console.log(`AT companies before: ${before.rows[0].n}`);
await client.query(sql);
const after = await client.query("select count(*)::int as n from companies where country = 'AT'");
const locs = await client.query(
  "select count(*)::int as n from locations l join companies c on c.id = l.company_id where c.country = 'AT'"
);
console.log(`AT companies after:  ${after.rows[0].n}`);
console.log(`AT locations:        ${locs.rows[0].n}`);
await client.end();
console.log("Done.");
