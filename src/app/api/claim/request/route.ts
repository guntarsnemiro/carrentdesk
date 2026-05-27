import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendClaimRequestNotification } from "@/lib/email";

export async function POST(request: Request) {
  let companyId: string, email: string, name: string, message: string;
  try {
    const body = await request.json();
    companyId = body.companyId;
    email = body.email?.trim();
    name = body.name?.trim();
    message = body.message?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!companyId || !email || !name) {
    return NextResponse.json({ error: "companyId, email and name are required." }, { status: 400 });
  }

  const db = createServiceRoleClient();

  const { data: company } = await db
    .from("companies")
    .select("id, name, slug, status")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  if (company.status !== "unclaimed") {
    return NextResponse.json({ error: "This listing has already been claimed." }, { status: 409 });
  }

  const { error } = await db.from("claim_requests").upsert(
    { company_id: companyId, email, name, message, status: "pending" },
    { onConflict: "company_id,email", ignoreDuplicates: false }
  );

  if (error) {
    console.error("[claim/request]", error);
    return NextResponse.json({ error: "Failed to save request." }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com";
  const adminUrl = `${base}/admin/pipeline`;

  try {
    await sendClaimRequestNotification({ name, email, message, companyName: company.name, companySlug: company.slug, adminUrl });
  } catch (err) {
    console.error("[claim/request] email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
