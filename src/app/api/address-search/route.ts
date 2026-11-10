import { NextResponse, type NextRequest } from "next/server";
import type { AddressHit } from "@/lib/booking/address";
import { getCityBySlug } from "@/lib/cities";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    country?: string;
    countrycode?: string;
  };
};

function labelOf(properties: NonNullable<PhotonFeature["properties"]>): string {
  const streetLine = [properties.housenumber, properties.street].filter(Boolean).join(" ");
  const parts = [properties.name, streetLine, properties.city, properties.country].filter(Boolean);
  return [...new Set(parts)].join(", ");
}

export async function GET(request: NextRequest) {
  const anywhere = request.nextUrl.searchParams.get("anywhere") === "1";
  const city = getCityBySlug(request.nextUrl.searchParams.get("city") ?? "");
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 3 || (!anywhere && !city)) return NextResponse.json({ results: [] as AddressHit[] });

  const photon = new URL("https://photon.komoot.io/api/");
  photon.searchParams.set("q", q);
  if (!anywhere && city) {
    photon.searchParams.set("lat", String(city.center[0]));
    photon.searchParams.set("lon", String(city.center[1]));
  }
  photon.searchParams.set("limit", "8");
  photon.searchParams.set("lang", "en");

  let payload: { features?: PhotonFeature[] };
  try {
    const response = await fetch(photon, {
      headers: { "User-Agent": "CarRentDesk (https://carrentdesk.com)" },
      next: { revalidate: 0 },
    });
    if (!response.ok) return NextResponse.json({ results: [], error: "unavailable" });
    payload = await response.json();
  } catch {
    return NextResponse.json({ results: [], error: "unavailable" });
  }

  const country = city?.countryCode.toLowerCase() ?? "";
  const results: AddressHit[] = [];
  const seen = new Set<string>();
  for (const feature of payload.features ?? []) {
    const properties = feature.properties;
    const coords = feature.geometry?.coordinates;
    const sameCountry = anywhere || !city
      || properties?.countrycode?.toLowerCase() === country
      || properties?.country?.toLowerCase() === city.country.toLowerCase();
    if (!properties || !sameCountry || !coords) continue;
    const label = labelOf(properties);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    results.push({ label, lng: coords[0], lat: coords[1] });
    if (results.length === 6) break;
  }
  return NextResponse.json({ results });
}
