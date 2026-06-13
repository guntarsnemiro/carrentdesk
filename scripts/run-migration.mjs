#!/usr/bin/env node
/**
 * Runs a .sql migration file against the database using a direct Postgres
 * connection (SUPABASE_DB_URL). Use for DDL the REST API can't do (enums,
 * tables, columns, etc.).
 *
 *   node --env-file=.env.local scripts/run-migration.mjs scripts/migrations/<file>.sql
 *
 * Statements are split on ";" and run individually (so ALTER TYPE ... ADD VALUE
 * is never wrapped in a transaction block). Comment lines (-- …) are ignored.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const conn = process.env.SUPABASE_DB_URL;
if (!conn) {
  console.error("❌  Missing SUPABASE_DB_URL in environment (.env.local).");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/run-migration.mjs <path-to-sql>");
  process.exit(1);
}

const sql = readFileSync(path.resolve(file), "utf8");
const statements = sql
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log(`Connected. Running ${statements.length} statements from ${path.basename(file)}…`);

let ok = 0;
for (const stmt of statements) {
  try {
    await client.query(stmt);
    ok++;
    process.stdout.write(".");
  } catch (e) {
    console.error(`\n❌  Failed statement:\n   ${stmt}\n   → ${e.message}`);
    await client.end();
    process.exit(1);
  }
}
console.log(`\n✅  Done: ${ok}/${statements.length} statements executed.`);
await client.end();
