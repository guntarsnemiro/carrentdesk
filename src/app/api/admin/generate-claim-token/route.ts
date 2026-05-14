import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

/**
 * Admin-only endpoint to generate a claim token for a company.
 *
 * Usage:
 *   curl -X POST https://carrentdesk.com/api/admin/generate-claim-token \
 *     -H "Content-Type: application/json" \
 *     -H "x-admin-secret: <ADMIN_SECRET>" \
 *     -d '{"companySlug": "my-company", "email": "owner@example.com"}'
 *
 * Returns:
 *   { "claimUrl": "https://carrentdesk.com/claim?token=..." }
 */
export async function POST(request: Request) {
  // Protect with a shared secret (set ADMIN_SECRET in Vercel env vars)
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let companySlug: string;
  let email: string | undefined;
  let expiresInDays = 30;

  try {
    const body = await request.json();
    companySlug = body.companySlug;
    email = body.email;
    if (body.expiresInDays) expiresInDays = Number(body.expiresInDays);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!companySlug) {
    return NextResponse.json({ error: "companySlug is required." }, { status: 400 });
  }

  const db = createServiceRoleClient();

  // Look up the company
  const { data: company } = await db
    .from("companies")
    .select("id, name")
    .eq("slug", companySlug)
    .maybeSingle();

  if (!company) {
    return NextResponse.json({ error: `Company not found: ${companySlug}` }, { status: 404 });
  }

  // Generate a secure random token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await db.from("claim_tokens").insert({
    company_id: company.id,
    token,
    sent_to_email: email ?? null,
    sent_at: email ? new Date().toISOString() : null,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("[generate-claim-token] insert error:", error);
    return NextResponse.json({ error: "Failed to create token." }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com";
  const claimUrl = `${base}/claim?token=${token}`;

  return NextResponse.json({
    ok: true,
    company: company.name,
    claimUrl,
    expiresAt,
    ...(email ? { sentToEmail: email } : {}),
  });
}
