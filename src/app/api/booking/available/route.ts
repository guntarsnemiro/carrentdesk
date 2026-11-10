import { NextResponse, type NextRequest } from "next/server";
import {
  BookingSearchError,
  findAvailableCars,
  findAvailableCarsForCity,
  PILOT_CITY_SLUG,
  PILOT_COMPANY_SLUG,
} from "@/lib/booking/search";

/**
 * GET /api/booking/available?city=riga&start=ISO&end=ISO
 * GET /api/booking/available?slug=baltic-car-rent&start=ISO&end=ISO
 *
 * Returns bookable cars that are free in the date range, with rental total
 * and the card fee (max 10% / €19). Never includes plate or VIN.
 */
export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";
  const slug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";
  const start = request.nextUrl.searchParams.get("start")?.trim() ?? "";
  const end = request.nextUrl.searchParams.get("end")?.trim() ?? "";

  if (!start || !end) {
    return NextResponse.json(
      { error: "Query params start and end (ISO datetimes) are required." },
      { status: 400 },
    );
  }

  try {
    const result = city
      ? await findAvailableCarsForCity({ city, start, end })
      : await findAvailableCars({
          slug: slug || PILOT_COMPANY_SLUG,
          start,
          end,
        });
    return NextResponse.json({
      ...result,
      city: result.city ?? (city || PILOT_CITY_SLUG),
    });
  } catch (err) {
    if (err instanceof BookingSearchError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[booking/available]", err);
    return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  }
}
