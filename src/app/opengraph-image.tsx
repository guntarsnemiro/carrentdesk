import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CarRentDesk — Best local car rentals across Europe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Brand OG image used whenever a page hasn't defined its own (the homepage,
 * /all, /for-rentals, and any future static route). Rendered on the edge by
 * Next.js' built-in `ImageResponse` so it stays cheap and fast.
 *
 * Per-route OG images live in `app/[city]/opengraph-image.tsx` and
 * `app/c/[slug]/opengraph-image.tsx`.
 */
export default function OGImage() {
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
        {/* Top row — brand mark + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f2a52",
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: -1,
            }}
          >
            CR
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
              CarRentDesk
            </span>
            <span style={{ fontSize: 16, opacity: 0.7, letterSpacing: 2, textTransform: "uppercase" }}>
              Baltic rentals · direct contact
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 920,
            }}
          >
            Best local car rentals across Europe.
          </span>
          <span style={{ fontSize: 28, opacity: 0.82, maxWidth: 860 }}>
            Independent operators in Riga, Tallinn, and Vilnius. No commission,
            no middleman — call them directly.
          </span>
        </div>

        {/* Bottom row — city pills */}
        <div style={{ display: "flex", gap: 14 }}>
          {["Riga · LV", "Tallinn · EE", "Vilnius · LT"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                fontSize: 20,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
