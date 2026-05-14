import { ImageResponse } from "next/og";
import { CITIES } from "@/lib/cities";
import { getListingBySlug } from "@/lib/listings";

export const runtime = "nodejs";
export const alt = "Car rental on CarRentDesk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Per-company OG image.
 *
 * Layout:
 *   - Brand mark top-left
 *   - Verified pill top-right (only when status === 'verified')
 *   - Company name + city as the dominant element
 *   - Short fleet/description line
 *   - Bottom stat row: fleet size, since-year, country
 */
export default async function CompanyOGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) {
    return new ImageResponse(<div />, { ...size });
  }

  const city = CITIES.find((c) => c.slug === listing.city);
  const verified = listing.status === "verified";
  const fleetCount =
    listing.fleet.countMin > 0 || listing.fleet.countMax > 0
      ? `${listing.fleet.countMin}–${listing.fleet.countMax}`
      : null;
  const rawBlurb =
    listing.fleet.description ||
    `Independent car rental in ${city?.name ?? "the Baltics"}.`;
  // Satori (the OG renderer) doesn't support -webkit-line-clamp, so we do
  // word-boundary truncation manually to keep the image from overflowing.
  const blurb =
    rawBlurb.length > 180 ? `${rawBlurb.slice(0, 177).trimEnd()}…` : rawBlurb;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background:
            "linear-gradient(135deg, #0a1f4a 0%, #122d6b 45%, #1d3771 100%)",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
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

          {verified && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(74,222,128,0.18)",
                border: "1px solid rgba(74,222,128,0.45)",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#4ade80",
                }}
              />
              Verified operator
            </div>
          )}
        </div>

        {/* Main block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {city && (
            <span
              style={{
                fontSize: 24,
                opacity: 0.8,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              {city.name} · {city.country}
            </span>
          )}
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 1040,
            }}
          >
            {listing.name}
          </span>
          <span
            style={{
              fontSize: 26,
              opacity: 0.85,
              maxWidth: 1040,
              lineHeight: 1.35,
            }}
          >
            {blurb}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {fleetCount && <Pill label="Fleet" value={`${fleetCount} vehicles`} />}
          {listing.foundedYear && (
            <Pill label="Since" value={String(listing.foundedYear)} />
          )}
          {city && <Pill label="Country" value={city.country} />}
        </div>
      </div>
    ),
    { ...size },
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        padding: "12px 22px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.20)",
      }}
    >
      <span
        style={{
          fontSize: 14,
          opacity: 0.7,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
