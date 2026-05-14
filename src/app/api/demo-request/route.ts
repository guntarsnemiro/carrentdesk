import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { sendAccessRequestNotification } from "@/lib/email";

/**
 * POST /api/demo-request
 *
 * Body (JSON):
 *   {
 *     name: string,
 *     email: string,
 *     phone?: string,
 *     companyName?: string,
 *     city?: string,
 *     fleetBucket?: 'fleet_1_10' | 'fleet_11_30' | 'fleet_31_100' | 'fleet_100_plus',
 *     message?: string,
 *     // honeypot — must be empty string
 *     website?: string,
 *   }
 *
 * Inserts a row into `public.demo_requests` using the service_role key.
 * This is a server-only route — the service_role key never touches the
 * client bundle.
 */

type SubmissionBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  companyName?: unknown;
  city?: unknown;
  fleetBucket?: unknown;
  message?: unknown;
  website?: unknown;
};

const ALLOWED_FLEET_BUCKETS = new Set([
  "fleet_1_10",
  "fleet_11_30",
  "fleet_31_100",
  "fleet_100_plus",
]);

const ALLOWED_CITIES = new Set([
  "Riga",
  "Tallinn",
  "Vilnius",
  "Other",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: SubmissionBody;
  try {
    body = (await req.json()) as SubmissionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // honeypot — bots fill out hidden fields, real users don't
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const companyName =
    typeof body.companyName === "string" ? body.companyName.trim() : null;
  const city = typeof body.city === "string" ? body.city.trim() : null;
  const fleetBucket =
    typeof body.fleetBucket === "string" ? body.fleetBucket.trim() : null;
  const message = typeof body.message === "string" ? body.message.trim() : null;

  if (!name || name.length > 200) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }
  if (city && !ALLOWED_CITIES.has(city)) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }
  if (fleetBucket && !ALLOWED_FLEET_BUCKETS.has(fleetBucket)) {
    return NextResponse.json({ error: "Invalid fleet size" }, { status: 400 });
  }
  if (message && message.length > 4000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Supabase env vars missing on server");
    return NextResponse.json(
      { error: "Server is not configured" },
      { status: 500 }
    );
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;
  const ipHash = hashIp(getClientIp(req));

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/demo_requests`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name,
      email,
      phone,
      company_name: companyName,
      city,
      fleet_bucket: fleetBucket,
      message,
      user_agent: userAgent,
      ip_hash: ipHash,
    }),
  });

  if (!insertRes.ok) {
    const text = await insertRes.text();
    console.error("Supabase insert failed", insertRes.status, text);
    return NextResponse.json(
      { error: "Could not save your request. Please email us instead." },
      { status: 502 }
    );
  }

  // Fire-and-forget — email failure must not block the success response
  sendAccessRequestNotification({ name, email, phone, companyName, city, fleetBucket, message }).catch(
    (err) => console.error("[demo-request] notification email failed:", err)
  );

  return NextResponse.json({ ok: true });
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

function hashIp(ip: string): string {
  // hashed so we never persist raw IPs (GDPR-friendly)
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
