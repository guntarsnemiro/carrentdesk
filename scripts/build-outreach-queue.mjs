/**
 * Build docs/sales/outreach-queue.csv from GSC Performance export.
 * Ranking = Google Search clicks (last 28 days), NOT marketplace rank/status.
 *
 * Usage: node scripts/build-outreach-queue.mjs
 * Input:  ~/Downloads/carrentdesk.com-Performance-on-Search-2026-07-26.xlsx
 */
import fs from "fs";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// Load .env.local for local runs (not committed).
const envLocal = fs.readFileSync(".env.local", "utf8");
for (const line of envLocal.split("\n")) {
  const trimmed = line.trim().replace(/^\uFEFF/, "");
  if (!trimmed || trimmed.startsWith("#")) continue;
  const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const GSC_PATH =
  process.env.GSC_EXPORT ??
  "c:/Users/User/Downloads/carrentdesk.com-Performance-on-Search-2026-07-26.xlsx";

const OUT_PATH = "docs/sales/outreach-queue.csv";

function slugFromUrl(url) {
  return url.replace(/https:\/\/(www\.)?carrentdesk\.com\/c\//, "").split("?")[0];
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const wb = XLSX.readFile(GSC_PATH);
const pages = XLSX.utils.sheet_to_json(wb.Sheets.Pages);

const bySlug = new Map();
for (const p of pages) {
  const url = p["Top pages"];
  if (!url?.includes("/c/")) continue;
  const slug = slugFromUrl(url);
  const prev = bySlug.get(slug);
  const row = {
    slug,
    gsc_clicks_28d: (prev?.gsc_clicks_28d ?? 0) + (+p.Clicks || 0),
    gsc_impressions_28d: (prev?.gsc_impressions_28d ?? 0) + (+p.Impressions || 0),
  };
  bySlug.set(slug, row);
}

const ranked = [...bySlug.values()].sort((a, b) => b.gsc_clicks_28d - a.gsc_clicks_28d).slice(0, 50);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. from .env.local)");
  process.exit(1);
}
const db = createClient(url, key);

const slugs = ranked.map((r) => r.slug);
const { data: companies, error } = await db
  .from("companies")
  .select("slug, name, city, country, phone, whatsapp, email, status, pipeline_stage")
  .in("slug", slugs);

if (error) throw error;
const coBySlug = new Map((companies ?? []).map((c) => [c.slug, c]));

const header = [
  "tier",
  "rank_gsc_clicks",
  "slug",
  "name",
  "city",
  "country",
  "gsc_clicks_28d",
  "gsc_impressions_28d",
  "phone",
  "whatsapp",
  "email",
  "status",
  "pipeline_stage",
  "campaign_stage",
  "last_contact",
  "last_channel",
  "next_followup",
  "msg_count",
  "notes",
].join(",");

const rows = ranked.map((r, i) => {
  const c = coBySlug.get(r.slug);
  const tier = i < 20 ? "A" : "B";
  return [
    tier,
    i + 1,
    r.slug,
    c?.name ?? "",
    c?.city ?? "",
    c?.country ?? "",
    r.gsc_clicks_28d,
    r.gsc_impressions_28d,
    c?.phone ?? "",
    c?.whatsapp ?? "",
    c?.email ?? "",
    c?.status ?? "",
    c?.pipeline_stage ?? "",
    "queued",
    "",
    "",
    "",
    "0",
    "",
  ]
    .map(csvEscape)
    .join(",");
});

fs.mkdirSync("docs/sales", { recursive: true });
fs.writeFileSync(OUT_PATH, [header, ...rows].join("\n") + "\n", "utf8");
console.log(`Wrote ${ranked.length} companies to ${OUT_PATH} (ranked by GSC clicks, 28d)`);
