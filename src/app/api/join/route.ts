import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCityBySlug } from "@/lib/cities";
import { uniqueSlug } from "@/lib/join/signup-helpers";
import { DRAFT_BRAND } from "@/lib/onboarding";
import { sendJoinSignupNotification } from "@/lib/email";
import type { Database } from "@/lib/supabase/database.types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";

    if (contactName.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }

    const cityMeta = getCityBySlug(city);
    if (!cityMeta) {
      return NextResponse.json({ error: "Please select a valid city." }, { status: 400 });
    }

    const db = createServiceRoleClient();
    const { data: created, error: createErr } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: contactName },
    });

    if (createErr || !created.user) {
      const already = (createErr?.message ?? "").toLowerCase().includes("already");
      return NextResponse.json(
        {
          error: already
            ? "An account with this email already exists. Sign in instead."
            : "Could not create the account. Please try again.",
        },
        { status: already ? 409 : 500 },
      );
    }

    const userId = created.user.id;
    const slug = await uniqueSlug(db, `draft-${userId.replace(/-/g, "").slice(0, 12)}`);
    const { data: company, error: companyErr } = await db
      .from("companies")
      .insert({
        name: DRAFT_BRAND,
        slug,
        status: "claimed",
        city: city as Database["public"]["Enums"]["city_slug"],
        country: cityMeta.countryCode as unknown as Database["public"]["Enums"]["country_code"],
        phone,
        email,
        contact_person: contactName,
        pipeline_stage: "active",
        listed_at: null,
        onboarding_step: 0,
      })
      .select("id, slug")
      .single();

    if (companyErr || !company) {
      console.error("[join/create]", companyErr);
      return NextResponse.json({ error: "Could not create the company. Please try again." }, { status: 500 });
    }

    await db.from("company_members").insert({
      user_id: userId,
      company_id: company.id,
      role: "owner",
    });

    await db
      .from("companies")
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: userId,
      })
      .eq("id", company.id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com";
    try {
      await sendJoinSignupNotification({
        contactName,
        email,
        phone,
        companyName: contactName,
        city: cityMeta.name,
        country: cityMeta.country,
        companySlug: company.slug,
        listingUrl: "",
        adminUrl: `${siteUrl}/admin/pipeline`,
      });
    } catch (err) {
      console.error("[join/create] owner notification failed:", err);
    }

    return NextResponse.json({ ok: true, slug: company.slug });
  } catch (err) {
    console.error("/api/join error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
