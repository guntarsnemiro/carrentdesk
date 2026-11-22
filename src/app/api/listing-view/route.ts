import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/listing-view
 * One browser opening a rental page. A repeat open adds to the count.
 * Stores no name, email, or IP.
 */
export async function POST(request: Request) {
  let body: { sessionId?: unknown; slug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  if (!UUID.test(sessionId) || !/^[a-z0-9-]{2,80}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid page view." }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { data: company } = await db
    .from("companies")
    .select("id, slug, city")
    .eq("slug", slug)
    .maybeSingle();
  if (!company) return NextResponse.json({ ok: true });

  const now = new Date().toISOString();
  const { data: existing } = await db
    .from("listing_views")
    .select("id, views")
    .eq("session_id", sessionId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("listing_views")
      .update({ views: existing.views + 1, updated_at: now })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Could not save the page view." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await db.from("listing_views").insert({
    session_id: sessionId,
    company_id: company.id,
    company_slug: company.slug,
    city_slug: company.city,
    views: 1,
    updated_at: now,
  });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Could not save the page view." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
