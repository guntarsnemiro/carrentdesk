import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCityBySlug } from "@/lib/cities";
import { findJoinListingMatches } from "@/lib/join/match-listings";
import { findOrCreateUserId, sendMagicLinkEmail, slugify, uniqueSlug } from "@/lib/join/signup-helpers";
import {
  sendClaimRequestNotification,
  sendJoinClaimPendingEmail,
  sendJoinSignupNotification,
} from "@/lib/email";
import type { Database } from "@/lib/supabase/database.types";

type JoinMode = "create" | "claim";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = (body.mode ?? "create") as JoinMode;
    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
    const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const companyId = typeof body.companyId === "string" ? body.companyId : "";

    if (companyName.length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters." }, { status: 400 });
    }
    if (contactName.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }

    const cityMeta = getCityBySlug(city);
    if (!cityMeta) {
      return NextResponse.json({ error: "Please select a valid city." }, { status: 400 });
    }

    const db = createServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com";
    const adminUrl = `${siteUrl}/admin/pipeline`;

    if (mode === "claim") {
      if (!companyId) {
        return NextResponse.json({ error: "Please select a listing to claim." }, { status: 400 });
      }

      const { data: company } = await db
        .from("companies")
        .select("id, name, slug, status, city")
        .eq("id", companyId)
        .maybeSingle();

      if (!company) {
        return NextResponse.json({ error: "Listing not found." }, { status: 404 });
      }
      if (company.status !== "unclaimed") {
        return NextResponse.json({ error: "This listing has already been claimed." }, { status: 409 });
      }
      if (company.city !== city) {
        return NextResponse.json({ error: "Selected listing does not match your city." }, { status: 400 });
      }

      const claimMessage = [`Phone: ${phone}`, `Signed up via /join`].join("\n");

      const { error: claimErr } = await db.from("claim_requests").upsert(
        {
          company_id: company.id,
          email,
          name: contactName,
          message: claimMessage,
          status: "pending",
        },
        { onConflict: "company_id,email", ignoreDuplicates: false }
      );

      if (claimErr) {
        console.error("[join/claim]", claimErr);
        return NextResponse.json({ error: "Failed to submit claim. Please try again." }, { status: 500 });
      }

      try {
        await sendClaimRequestNotification({
          name: contactName,
          email,
          message: claimMessage,
          companyName: company.name,
          companySlug: company.slug,
          adminUrl,
        });
        await sendJoinClaimPendingEmail({ email, contactName, companyName: company.name });
      } catch (err) {
        console.error("[join/claim] email failed:", err);
      }

      return NextResponse.json({ ok: true, mode: "claim_pending" as const });
    }

    // ── Create new listing ──────────────────────────────────────────
    const matches = await findJoinListingMatches(db, { companyName, city, phone });
    const strongMatch = matches.find((m) => slugify(m.name) === slugify(companyName));
    if (strongMatch) {
      return NextResponse.json(
        {
          error: "A similar listing already exists. Please claim it instead of creating a new one.",
          suggestClaimId: strongMatch.id,
        },
        { status: 409 }
      );
    }

    const userId = await findOrCreateUserId(db, email);

    const { data: existingMembership } = await db
      .from("company_members")
      .select("company_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMembership) {
      await sendMagicLinkEmail(db, email, companyName, siteUrl);
      return NextResponse.json({ ok: true, mode: "existing_account" as const });
    }

    const slug = await uniqueSlug(db, slugify(companyName));

    const { data: company, error: companyErr } = await db
      .from("companies")
      .insert({
        name: companyName,
        slug,
        status: "claimed",
        city: city as Database["public"]["Enums"]["city_slug"],
        country: cityMeta.countryCode as unknown as Database["public"]["Enums"]["country_code"],
        phone,
        email,
        contact_person: contactName,
        pipeline_stage: "trial",
      })
      .select("id, slug")
      .single();

    if (companyErr || !company) {
      console.error("[join/create]", companyErr);
      return NextResponse.json({ error: "Could not create company. Please try again." }, { status: 500 });
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

    await sendMagicLinkEmail(db, email, companyName, siteUrl);

    try {
      await sendJoinSignupNotification({
        contactName,
        email,
        phone,
        companyName,
        city: cityMeta.name,
        country: cityMeta.country,
        companySlug: company.slug,
        listingUrl: `${siteUrl}/c/${company.slug}`,
        adminUrl,
      });
    } catch (err) {
      console.error("[join/create] owner notification failed:", err);
    }

    return NextResponse.json({ ok: true, mode: "created" as const, slug: company.slug });
  } catch (err) {
    console.error("/api/join error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
