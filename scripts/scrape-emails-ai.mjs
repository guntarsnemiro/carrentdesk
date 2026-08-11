#!/usr/bin/env node
/**
 * AI-powered email extractor for all companies that have a website but no email.
 *
 * Strategy:
 *   1. Pull companies with website but no email from Supabase
 *   2. For each company: fetch homepage + /contact page HTML
 *   3. Strip tags, trim to ~6K chars, send to GPT-4o-mini
 *   4. GPT returns { email: "found@example.com" | null }
 *   5. Write results to docs/sales/ai-email-results.csv
 *   6. With --apply: update companies.email in Supabase
 *
 * Usage:
 *   node --env-file=.env.local scripts/scrape-emails-ai.mjs
 *   node --env-file=.env.local scripts/scrape-emails-ai.mjs --limit 100
 *   node --env-file=.env.local scripts/scrape-emails-ai.mjs --apply
 *   node --env-file=.env.local scripts/scrape-emails-ai.mjs --offset 500 --limit 500
 *
 * Cost estimate: ~$0.001/company → ~$5 for all 5,000
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { URL } from "node:url";
import pg from "pg";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const OUT_PATH = path.join(ROOT, "..", "docs", "sales", "ai-email-results.csv");

const args = process.argv.slice(2);
const limit   = args.includes("--limit")  ? +args[args.indexOf("--limit")  + 1] : 9999;
const offset  = args.includes("--offset") ? +args[args.indexOf("--offset") + 1] : 0;
const apply   = args.includes("--apply");
const delayMs = args.includes("--delay")  ? +args[args.indexOf("--delay")  + 1] : 600;
const dryRun  = args.includes("--dry-run");

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const DB_URL     = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENAI_KEY) { console.error("Missing OPENAI_API_KEY"); process.exit(1); }

// ── HTTP fetch helper ─────────────────────────────────────────────────────────

function fetchUrl(rawUrl, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let url;
    try { url = new URL(rawUrl); } catch { return resolve(null); }
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.get(
      { hostname: url.hostname, path: url.pathname + url.search, port: url.port || undefined,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CarRentDeskBot/1.0)", Accept: "text/html" },
        timeout: timeoutMs },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          try {
            const next = new URL(res.headers.location, rawUrl).href;
            if (next !== rawUrl) return resolve(fetchUrl(next, timeoutMs));
          } catch { return resolve(null); }
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => { if (body.length < 300_000) body += c; });
        res.on("end", () => resolve(body));
        res.on("error", () => resolve(null));
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

// ── HTML → plain text (strip tags, scripts, styles) ──────────────────────────

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Quick regex pre-check (skip GPT if we find it instantly) ─────────────────

const EMAIL_RE = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi;
const BLOCKED  = ["noreply","no-reply","donotreply","wordpress","wixpress","sentry",
                  "example.com","yourdomain","schema.org","cloudflare","googleapis",
                  "@2x","@3x",".png",".jpg",".gif",".webp"];

function quickExtract(text) {
  const matches = [...text.matchAll(EMAIL_RE)].map((m) => m[0].toLowerCase());
  return matches.find((e) => !BLOCKED.some((b) => e.includes(b))) ?? null;
}

// ── OpenAI call ───────────────────────────────────────────────────────────────

async function askGpt(companyName, textChunk) {
  const body = JSON.stringify({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 60,
    messages: [
      {
        role: "system",
        content: "You are an email extraction assistant. Extract the primary business contact email from the provided text. Return ONLY a JSON object: {\"email\":\"found@example.com\"} or {\"email\":null} if none found. Never invent emails.",
      },
      {
        role: "user",
        content: `Company: ${companyName}\n\nPage text:\n${textChunk.slice(0, 6000)}`,
      },
    ],
  });

  return new Promise((resolve) => {
    const req = https.request(
      { hostname: "api.openai.com", path: "/v1/chat/completions", method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}`,
                   "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.message?.content ?? "{}";
            const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
            resolve(parsed.email ?? null);
          } catch { resolve(null); }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.write(body);
    req.end();
  });
}

// ── Contact page paths to try ─────────────────────────────────────────────────

const CONTACT_PATHS = ["/contact", "/contact-us", "/kontakt", "/contacto",
                       "/contacts", "/about", "/en/contact", "/o-nas"];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Fetch companies
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,slug,website&email=is.null&website=not.is.null&order=name&limit=${limit}&offset=${offset}`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const companies = await resp.json();
  console.log(`\n📋 Processing ${companies.length} companies (offset ${offset})…\n`);

  const rows = ["id,slug,name,website,email,source,found_at"];
  let found = 0, gptUsed = 0, failed = 0;

  for (let i = 0; i < companies.length; i++) {
    const co = companies[i];
    let website = co.website;
    if (!website) continue;
    if (!website.startsWith("http")) website = "https://" + website;

    process.stdout.write(`[${i + 1}/${companies.length}] ${co.name.slice(0, 40).padEnd(40)} `);

    let email = null;
    let source = "-";

    try {
      // 1. Fetch homepage
      const homeHtml = await fetchUrl(website);
      if (homeHtml) {
        const homeText = stripHtml(homeHtml);
        email = quickExtract(homeText);
        if (email) { source = "homepage-regex"; }
        else if (!dryRun) {
          // 2. Try /contact page
          let contactText = homeText;
          for (const p of CONTACT_PATHS) {
            try {
              const contactHtml = await fetchUrl(new URL(p, website).href, 6000);
              if (contactHtml && contactHtml.length > 200) {
                contactText = stripHtml(contactHtml);
                break;
              }
            } catch { /* */ }
          }
          // 3. GPT extraction
          email = await askGpt(co.name, contactText);
          if (email) { source = "gpt-4o-mini"; gptUsed++; }
        }
      }
    } catch { /* network error */ }

    if (email) {
      found++;
      console.log(`✓ ${email} [${source}]`);
    } else {
      failed++;
      console.log(`✗ not found`);
    }

    rows.push([co.id, co.slug, `"${co.name.replace(/"/g, '""')}"`, co.website, email ?? "", source,
               new Date().toISOString()].join(","));

    // Apply to DB immediately if --apply
    if (apply && email) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/companies?id=eq.${co.id}`,
        { method: "PATCH", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ email }) }
      );
    }

    if (i < companies.length - 1) await new Promise((r) => setTimeout(r, delayMs));
  }

  // Write CSV
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const outFile = apply
    ? OUT_PATH
    : OUT_PATH.replace(".csv", `-${offset}-${offset + companies.length}.csv`);
  fs.writeFileSync(outFile, rows.join("\n"), "utf8");

  console.log(`\n✅ Done. Found: ${found}/${companies.length} | GPT used: ${gptUsed} | Output: ${outFile}`);
  if (apply) console.log(`   Emails written to Supabase.`);
  else console.log(`   Run with --apply to save emails to the database.`);
}

main().catch(console.error);
