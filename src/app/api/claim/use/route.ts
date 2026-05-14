import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // 1. Verify the caller is authenticated
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // 2. Parse and validate input
  let token: string;
  try {
    ({ token } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const db = createServiceRoleClient();

  // 3. Look up the token
  const { data: ct } = await db
    .from("claim_tokens")
    .select("id, company_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!ct) {
    return NextResponse.json({ error: "Invalid claim token." }, { status: 400 });
  }
  if (ct.used_at) {
    return NextResponse.json({ error: "This claim link has already been used." }, { status: 400 });
  }
  if (new Date(ct.expires_at) < new Date()) {
    return NextResponse.json({ error: "This claim link has expired." }, { status: 400 });
  }

  // 4. Check user isn't already a member of this company
  const { data: existing } = await db
    .from("company_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("company_id", ct.company_id)
    .maybeSingle();

  if (existing) {
    // Already a member — just mark the token as used and redirect to dashboard
    await db
      .from("claim_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", ct.id);
    return NextResponse.json({ ok: true });
  }

  // 5. Insert company_members row
  const { error: insertError } = await db.from("company_members").insert({
    user_id: user.id,
    company_id: ct.company_id,
    role: "owner",
  });

  if (insertError) {
    console.error("[claim/use] insert error:", insertError);
    return NextResponse.json({ error: "Failed to link your account. Please try again." }, { status: 500 });
  }

  // 6. Mark company as claimed + set claimed_by_user_id
  await db
    .from("companies")
    .update({
      status: "claimed",
      claimed_at: new Date().toISOString(),
      claimed_by_user_id: user.id,
    })
    .eq("id", ct.company_id)
    .eq("status", "unclaimed"); // only upgrade if still unclaimed; don't downgrade verified ones

  // 7. Mark the token as used
  await db
    .from("claim_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", ct.id);

  return NextResponse.json({ ok: true });
}
