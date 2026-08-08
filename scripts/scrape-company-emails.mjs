#!/usr/bin/env node
/**
 * Scrape business emails from top rental websites (regex + mailto).
 *
 * Usage:
 *   node --env-file=.env.local scripts/scrape-company-emails.mjs
 *   node --env-file=.env.local scripts/scrape-company-emails.mjs --limit 20
 *   node --env-file=.env.local scripts/scrape-company-emails.mjs --apply
 *
 * Reads slugs from docs/sales/outreach-queue.csv (GSC click ranking).
 * Writes docs/sales/email-scrape-results.csv
 * With --apply: updates companies.email where currently null.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const QUEUE_PATH = path.join(ROOT, "..", "docs", "sales", "outreach-queue.csv");
const OUT_PATH = path.join(ROOT, "..", "docs", "sales", "email-scrape-results.csv");

const args = process.argv.slice(2);
const limit = args.includes("--limit")
  ? +args[args.indexOf("--limit") + 1]
  : 50;
const apply = args.includes("--apply");
const delayMs = args.includes("--delay")
  ? +args[args.indexOf("--delay") + 1]
  : 400;

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const MAILTO_RE = /mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi;

const BLOCKED = [
  "noreply", "no-reply", "donotreply", "wordpress", "wixpress", "sentry.io",
  "example.com", "example.org", "yourdomain", "domain.com", "email.com",
  "facebook.com", "instagram.com", "google.com", "googleapis.com", "w3.org",
  "schema.org", "gravatar.com", "cloudflare.com", "sentry-next.wixpress.com",
  "u003e", "png", "jpg", "jpeg", "gif", "webp", "2x", "3x",
];

const CONTACT_PATHS = [
  "",
  "/contact",
  "/contact-us",
  "/contacts",
  "/kontakt",
  "/contacto",
  "/about",
  "/about-us",
  "/en/contact",
  "/en/contact-us",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeWebsite(raw) {
  if (!raw?.trim()) return null;
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const url = new URL(u);
    return url.origin;
  } catch {
    return null;
  }
}

function siteHost(website) {
  try {
    return new URL(website).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function extractEmails(html) {
  const text = decodeHtmlEntities(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  const found = new Set();
  for (const m of text.matchAll(MAILTO_RE)) found.add(m[1].toLowerCase());
  for (const m of text.matchAll(EMAIL_RE)) found.add(m[0].toLowerCase());
  return [...found];
}

function isBlocked(email) {
  const e = email.toLowerCase();
  if (e.length > 80) return true;
  if (e.includes("..")) return true;
  if (/@\d/.test(e)) return true;
  return BLOCKED.some((b) => e.includes(b));
}

function scoreEmail(email, host) {
  if (isBlocked(email)) return -999;
  const lower = email.toLowerCase();
  const domain = lower.split("@")[1] ?? "";
  const h = host.toLowerCase();

  if (h && (domain === h || domain.endsWith(`.${h}`) || h.endsWith(domain))) return 100;
  if (/^(info|rent|booking|office|contact|hello|reservations|support)@/.test(lower)) return 40;
  if (domain.endsWith(".gr") || domain.endsWith(".al") || domain.endsWith(".hr")) return 20;
  return 10;
}

function pickBest(emails, host) {
  const ranked = emails
    .map((e) => ({ e, score: scoreEmail(e, host) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0] ?? null;
}

async function fetchPage(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "CarRentDeskEmailBot/1.0 (+https://carrentdesk.com; contact info lookup)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return { ok: false, status: res.status, html: "" };
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      return { ok: false, status: res.status, html: "", reason: "not-html" };
    }
    const html = await res.text();
    return { ok: true, status: res.status, html: html.slice(0, 500_000), finalUrl: res.url };
  } catch (err) {
    return { ok: false, status: 0, html: "", reason: err.name === "AbortError" ? "timeout" : String(err.message) };
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeWebsite(website) {
  const origin = normalizeWebsite(website);
  if (!origin) return { email: null, source: null, error: "bad-url", tried: [] };

  const host = siteHost(origin);
  const tried = [];
  let allEmails = [];
  let hitUrl = null;

  for (const p of CONTACT_PATHS) {
    const url = p ? `${origin}${p}` : origin;
    tried.push(url);
    const page = await fetchPage(url);
    await sleep(delayMs);
    if (!page.ok || !page.html) continue;

    const emails = extractEmails(page.html);
    if (emails.length) {
      allEmails.push(...emails);
      hitUrl = page.finalUrl ?? url;
      const best = pickBest([...new Set(allEmails)], host);
      if (best && best.score >= 100) {
        return { email: best.e, score: best.score, source: hitUrl, tried, all: [...new Set(allEmails)] };
      }
    }
  }

  const best = pickBest([...new Set(allEmails)], host);
  if (best) {
    return { email: best.e, score: best.score, source: hitUrl, tried, all: [...new Set(allEmails)] };
  }
  return { email: null, source: hitUrl, tried, all: [...new Set(allEmails)] };
}

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

loadEnvLocal();

const queue = csvParse(fs.readFileSync(QUEUE_PATH, "utf8")).slice(0, limit);
const slugs = queue.map((r) => r.slug);

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const { rows: companies } = await client.query(
  `select slug, name, city, country, website, email, phone
   from public.companies
   where slug = any($1::text[])`,
  [slugs]
);
const bySlug = new Map(companies.map((c) => [c.slug, c]));

const results = [];
let found = 0;
let skippedHasEmail = 0;
let noWebsite = 0;

console.log(`Scraping emails for top ${limit} rentals from outreach queue...\n`);

for (const q of queue) {
  const co = bySlug.get(q.slug);
  if (!co) {
    results.push({ ...q, result: "missing-in-db", email: "", website: "" });
    console.log(`  ? ${q.slug} — not in DB`);
    continue;
  }

  if (co.email?.trim()) {
    skippedHasEmail++;
    results.push({
      slug: co.slug,
      name: co.name,
      gsc_clicks: q.gsc_clicks_28d,
      website: co.website ?? "",
      email_found: co.email,
      email_existing: co.email,
      source_url: "",
      status: "already_has_email",
    });
    console.log(`  = ${co.slug} — already has ${co.email}`);
    continue;
  }

  if (!co.website?.trim()) {
    noWebsite++;
    results.push({
      slug: co.slug,
      name: co.name,
      gsc_clicks: q.gsc_clicks_28d,
      website: "",
      email_found: "",
      email_existing: "",
      source_url: "",
      status: "no_website",
    });
    console.log(`  - ${co.slug} — no website`);
    continue;
  }

  process.stdout.write(`  … ${co.slug} (${co.website}) `);
  const scraped = await scrapeWebsite(co.website);

  if (scraped.email) {
    found++;
    results.push({
      slug: co.slug,
      name: co.name,
      gsc_clicks: q.gsc_clicks_28d,
      website: co.website,
      email_found: scraped.email,
      email_existing: "",
      source_url: scraped.source ?? "",
      status: "found",
      score: scraped.score,
      candidates: (scraped.all ?? []).join("; "),
    });
    console.log(`→ ${scraped.email}`);

    if (apply) {
      await client.query(
        `update public.companies set email = $1 where slug = $2 and (email is null or trim(email) = '')`,
        [scraped.email, co.slug]
      );
    }
  } else {
    results.push({
      slug: co.slug,
      name: co.name,
      gsc_clicks: q.gsc_clicks_28d,
      website: co.website,
      email_found: "",
      email_existing: "",
      source_url: scraped.source ?? "",
      status: scraped.all?.length ? "candidates_rejected" : "not_found",
      candidates: (scraped.all ?? []).join("; "),
      error: scraped.error ?? "",
    });
    console.log(`→ none${scraped.all?.length ? ` (raw: ${scraped.all.join(", ")})` : ""}`);
  }
}

await client.end();

const headers = [
  "slug", "name", "gsc_clicks", "website", "email_found", "email_existing",
  "source_url", "status", "score", "candidates", "error",
];
const csv = [
  headers.join(","),
  ...results.map((r) => headers.map((h) => csvEscape(r[h] ?? "")).join(",")),
].join("\n");
fs.writeFileSync(OUT_PATH, csv, "utf8");

console.log(`\nDone.`);
console.log(`  Found:            ${found}`);
console.log(`  Already had email: ${skippedHasEmail}`);
console.log(`  No website:       ${noWebsite}`);
console.log(`  Not found:        ${results.filter((r) => r.status === "not_found" || r.status === "candidates_rejected").length}`);
console.log(`  Results:          ${OUT_PATH}`);
if (apply) console.log(`  Applied updates to Supabase (email column).`);
else console.log(`  Dry run — re-run with --apply to save emails to DB.`);
