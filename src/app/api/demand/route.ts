import { NextResponse, type NextRequest } from "next/server";
import { cityAirports, getCityBySlug } from "@/lib/cities";
import { createServiceRoleClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

type PlaceBody = { kind?: unknown; code?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function dateOrNull(value: unknown): string | null {
  const raw = text(value);
  if (!raw || !DATE.test(raw) || Number.isNaN(Date.parse(raw))) return null;
  return raw;
}

export async function POST(request: NextRequest) {
  let body: {
    sessionId?: unknown;
    citySlug?: unknown;
    pickupDate?: unknown;
    returnDate?: unknown;
    pickupTime?: unknown;
    returnTime?: unknown;
    place?: PlaceBody | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const sessionId = text(body.sessionId);
  const city = getCityBySlug(text(body.citySlug));
  if (!UUID.test(sessionId) || !city) {
    return NextResponse.json({ error: "Invalid search." }, { status: 400 });
  }

  const pickupDate = dateOrNull(body.pickupDate);
  const returnDate = dateOrNull(body.returnDate);
  const pickupTime = TIME.test(text(body.pickupTime)) ? text(body.pickupTime) : null;
  const returnTime = TIME.test(text(body.returnTime)) ? text(body.returnTime) : null;
  if (!pickupDate || !returnDate || !pickupTime || !returnTime) {
    return NextResponse.json({ error: "Invalid dates." }, { status: 400 });
  }

  let placeKind: "airport" | "city" | "office" | undefined;
  let placeCode: string | undefined;
  let placeLabel: string | undefined;
  if (body.place != null) {
    const kind = text(body.place.kind);
    const code = text(body.place.code);
    if (kind === "city" && code === "city") {
      placeKind = "city";
      placeCode = "city";
      placeLabel = `In ${city.name}`;
    } else if (kind === "airport") {
      const airport = cityAirports(city).find((item) => item.code === code);
      if (!airport) return NextResponse.json({ error: "Unknown airport." }, { status: 400 });
      placeKind = "airport";
      placeCode = airport.code;
      placeLabel = airport.name;
    } else if (kind === "office" && UUID.test(code)) {
      placeKind = "office";
      placeCode = code;
      placeLabel = "Office";
    } else {
      return NextResponse.json({ error: "Unknown place." }, { status: 400 });
    }
  }

  const db = createServiceRoleClient();
  if (placeKind === "office" && placeCode) {
    const { data: location } = await db.from("locations").select("name, address").eq("id", placeCode).maybeSingle();
    if (location) placeLabel = location.name || location.address || "Office";
  }

  const dates = {
    pickup_date: pickupDate,
    return_date: returnDate,
    pickup_time: pickupTime,
    return_time: returnTime,
    updated_at: new Date().toISOString(),
  };
  const place = placeKind
    ? { place_kind: placeKind, place_code: placeCode, place_label: placeLabel }
    : {};

  const { data: existing } = await db
    .from("search_demand")
    .select("id")
    .eq("session_id", sessionId)
    .eq("city_slug", city.slug)
    .maybeSingle();

  if (existing) {
    const { error } = await db.from("search_demand").update({ ...dates, ...place }).eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Could not save the search." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await db.from("search_demand").insert({
    session_id: sessionId,
    city_slug: city.slug,
    ...dates,
    ...place,
  });
  if (error && error.code === "23505") {
    const { error: updateError } = await db
      .from("search_demand")
      .update({ ...dates, ...place })
      .eq("session_id", sessionId)
      .eq("city_slug", city.slug);
    if (updateError) return NextResponse.json({ error: "Could not save the search." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (error) return NextResponse.json({ error: "Could not save the search." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
