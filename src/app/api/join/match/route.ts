import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCityBySlug } from "@/lib/cities";
import { findJoinListingMatches } from "@/lib/join/match-listings";

export async function POST(req: Request) {
  try {
    const { companyName, city, phone } = await req.json();

    if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters." }, { status: 400 });
    }
    if (!city || typeof city !== "string" || !getCityBySlug(city)) {
      return NextResponse.json({ error: "Please select a valid city." }, { status: 400 });
    }

    const db = createServiceRoleClient();
    const matches = await findJoinListingMatches(db, {
      companyName: companyName.trim(),
      city,
      phone: typeof phone === "string" ? phone.trim() : undefined,
    });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("/api/join/match error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
