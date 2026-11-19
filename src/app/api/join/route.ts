import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { slugify, uniqueSlug } from "@/lib/join/signup-helpers";
import { DRAFT_BRAND } from "@/lib/onboarding";
import { sendJoinSignupNotification } from "@/lib/email";
import type { Database } from "@/lib/supabase/database.types";

type CountryCode = Database["public"]["Enums"]["country_code"];

/** All country codes currently in the enum. */
const KNOWN_COUNTRY_CODES = new Set<string>([
  "LV","EE","LT","NO","SE","DK","FI","IS","ES","PT","IT","GR","HR","CY",
  "MT","SI","FR","ME","AL","BG","GB","IE","TR","DE","NL","BE","LU","CH",
  "AT","PL",
]);

/** Country display names for the signup form dropdown. */
export const COUNTRY_OPTIONS: { code: CountryCode | "OTHER"; name: string }[] = [
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "NO", name: "Norway" },
  { code: "SE", name: "Sweden" },
  { code: "DK", name: "Denmark" },
  { code: "IS", name: "Iceland" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "PL", name: "Poland" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" },
  { code: "GR", name: "Greece" },
  { code: "HR", name: "Croatia" },
  { code: "SI", name: "Slovenia" },
  { code: "BG", name: "Bulgaria" },
  { code: "CY", name: "Cyprus" },
  { code: "MT", name: "Malta" },
  { code: "ME", name: "Montenegro" },
  { code: "AL", name: "Albania" },
  { code: "LU", name: "Luxembourg" },
  { code: "TR", name: "Turkey" },
  { code: "OTHER", name: "Other country" },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    // City: either a known slug from the dropdown, or a custom city name
    const isCustomCity = body.isCustomCity === true;
    const cityInput = typeof body.city === "string" ? body.city.trim() : "";
    const customCityName = typeof body.customCityName === "string" ? body.customCityName.trim() : "";
    const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim().toUpperCase() : "";
    const customCountryName = typeof body.customCountryName === "string" ? body.customCountryName.trim() : "";

    // Validate inputs
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

    let citySlug: string;
    let cityDisplayName: string;
    let resolvedCountryCode: CountryCode;
    let countryDisplayName: string;
    let isNewCity = false;

    if (isCustomCity) {
      // New city flow
      if (customCityName.length < 2) {
        return NextResponse.json({ error: "Please enter your city name." }, { status: 400 });
      }
      if (!countryCode) {
        return NextResponse.json({ error: "Please select your country." }, { status: 400 });
      }

      citySlug = slugify(customCityName);
      if (!citySlug || citySlug.length < 2) {
        return NextResponse.json({ error: "City name must contain letters." }, { status: 400 });
      }

      cityDisplayName = customCityName;
      resolvedCountryCode = (KNOWN_COUNTRY_CODES.has(countryCode) ? countryCode : "OTHER") as CountryCode;
      countryDisplayName = customCountryName || countryCode;
      isNewCity = true;
    } else {
      // Known city flow
      const cityMeta = getCityBySlug(cityInput);
      if (!cityMeta) {
        return NextResponse.json({ error: "Please select a city." }, { status: 400 });
      }
      citySlug = cityMeta.slug;
      cityDisplayName = cityMeta.name;
      resolvedCountryCode = cityMeta.countryCode as CountryCode;
      countryDisplayName = cityMeta.country;
      isNewCity = false;
    }

    const db = createServiceRoleClient();

    // Create auth user
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
    const companySlug = await uniqueSlug(db, `draft-${userId.replace(/-/g, "").slice(0, 12)}`);

    const { data: company, error: companyErr } = await db
      .from("companies")
      .insert({
        name: DRAFT_BRAND,
        slug: companySlug,
        status: "claimed",
        city: citySlug,
        city_name: isNewCity ? cityDisplayName : null,
        country: resolvedCountryCode,
        country_name: isNewCity ? countryDisplayName : null,
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
      .update({ claimed_at: new Date().toISOString(), claimed_by_user_id: userId })
      .eq("id", company.id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com";
    try {
      await sendJoinSignupNotification({
        contactName,
        email,
        phone,
        companyName: contactName,
        city: cityDisplayName,
        country: countryDisplayName,
        companySlug: company.slug,
        listingUrl: "",
        adminUrl: `${siteUrl}/admin/pipeline`,
        isNewCity,
        citySlug,
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
