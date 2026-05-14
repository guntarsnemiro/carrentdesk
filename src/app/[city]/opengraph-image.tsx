import { ImageResponse } from "next/og";
import { getCityBySlug } from "@/lib/cities";
import { filterListings } from "@/lib/listings";

export const runtime = "nodejs";
export const alt = "Car rentals in this city — CarRentDesk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Per-city OG image. Rendered on demand at the city's slug.
 *
 * Note: we use the Node runtime here (not edge) because the listings query
 * depends on the server Supabase client which Next.js loads only at runtime
 * outside the edge environment.
 */
export default async function CityOGImage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) {
    return new ImageResponse(<div />, { ...size });
  }

  const listings = await filterListings({ city: city.slug });
  const verifiedCount = listings.filter((l) => l.status === "verified").length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background:
            "linear-gradient(135deg, #0a1f4a 0%, #122d6b 45%, #1d3771 100%)",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f2a52",
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: -1,
            }}
          >
            CR
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
            CarRentDesk
          </span>
        </div>

        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span
            style={{
              fontSize: 28,
              opacity: 0.8,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {city.country} · {city.countryCode}
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            Car rentals in {city.name}
          </span>
          <span style={{ fontSize: 28, opacity: 0.85, maxWidth: 900 }}>
            {city.tagline}.
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16 }}>
          <Stat label="Listings" value={String(listings.length)} />
          <Stat label="Verified" value={String(verifiedCount)} accent />
          <Stat label="Direct contact" value="Yes" />
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "16px 28px",
        borderRadius: 18,
        background: accent ? "rgba(74, 222, 128, 0.18)" : "rgba(255,255,255,0.10)",
        border: accent
          ? "1px solid rgba(74, 222, 128, 0.40)"
          : "1px solid rgba(255,255,255,0.20)",
        minWidth: 140,
      }}
    >
      <span style={{ fontSize: 16, opacity: 0.7, letterSpacing: 2, textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.2 }}>
        {value}
      </span>
    </div>
  );
}
