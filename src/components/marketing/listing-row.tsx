import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { formatKm, haversineKm } from "@/lib/geo";
import type { Listing } from "@/lib/listings-types";

/**
 * Compact, no-image row for *unverified* (unclaimed / claimed-but-not-verified)
 * listings. Used on the city pages and `/all` so the marketplace can carry many
 * rentals without each one needing its own image — and so the visual contrast
 * with verified-card operators is immediate.
 *
 * Layout: two lines, each filled wall-to-wall.
 *
 *   Line 1:  Name · Since YYYY · 50–80 vehicles · short description…    View →
 *   Line 2:  📍 address · 4.8 km centre · 4.3 km RIX · 📞 phone · 🌐 site
 *
 * Every chip is conditional, so listings with sparse data still produce a tidy
 * row without leaving large empty regions.
 */
export function ListingRow({ listing }: { listing: Listing }) {
  const city = CITIES.find((c) => c.slug === listing.city);

  const hasFleetCount =
    listing.fleet.countMin > 0 || listing.fleet.countMax > 0;
  const fleetSnippet =
    listing.fleet.description ||
    `Independent local rental in ${city?.name ?? "the Baltics"}.`;

  const distanceFromCenterKm =
    city && listing.coordinates
      ? haversineKm(listing.coordinates, {
          lat: city.center[0],
          lng: city.center[1],
        })
      : undefined;
  const distanceFromAirportKm =
    city && listing.coordinates
      ? haversineKm(listing.coordinates, city.airport)
      : undefined;

  const websiteDomain = formatDomain(listing.website);

  const hasMetaRow =
    Boolean(listing.address) ||
    distanceFromCenterKm != null ||
    distanceFromAirportKm != null ||
    Boolean(listing.phone) ||
    Boolean(listing.whatsapp) ||
    Boolean(websiteDomain);

  return (
    <Link
      href={`/c/${listing.slug}`}
      className="group flex flex-col gap-2 px-4 py-5 transition-colors hover:bg-surface-soft sm:px-5"
    >
      {/* Line 1: name, since-year, fleet count + description, View →
          The middle slot grows to consume the empty space on wider screens
          and truncates with ellipsis on narrower ones. */}
      <div className="flex items-baseline justify-between gap-4">
        <p className="min-w-0 flex-1 truncate text-[15px] leading-6 text-neutral-700 sm:text-base">
          <span className="font-semibold text-brand-950 group-hover:text-brand-700">
            {listing.name}
          </span>
          {listing.googleRating && (
            <>
              <Sep />
              <span className="text-neutral-600">
                <span className="text-amber-400">★</span>{" "}
                {listing.googleRating.toFixed(1)}
                {listing.googleReviews && (
                  <span className="text-neutral-400"> ({listing.googleReviews})</span>
                )}
              </span>
            </>
          )}
          {listing.foundedYear && (
            <>
              <Sep />
              <span className="text-neutral-500">
                Since {listing.foundedYear}
              </span>
            </>
          )}
          {hasFleetCount && (
            <>
              <Sep />
              <span className="font-medium text-brand-900">
                {listing.fleet.countMin}–{listing.fleet.countMax} vehicles
              </span>
            </>
          )}
          <Sep />
          <span className="text-neutral-700">{fleetSnippet}</span>
        </p>
        <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-700 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-900 sm:inline-flex">
          View profile
          <span aria-hidden>→</span>
        </span>
      </div>

      {/* Line 2: location, distance, and contact chips — all on a single
          wrapping row so this line is also visually filled. */}
      {hasMetaRow && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-neutral-600 sm:text-sm">
          {listing.address && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <PinIcon />
              <span className="max-w-[32rem] truncate">{listing.address}</span>
            </span>
          )}
          {distanceFromCenterKm != null && (
            <span className="text-neutral-500">
              {formatKm(distanceFromCenterKm)} centre
            </span>
          )}
          {distanceFromAirportKm != null && city && (
            <span className="text-neutral-500">
              {formatKm(distanceFromAirportKm)} {city.airport.code}
            </span>
          )}
          {listing.phone && (
            <span className="inline-flex items-center gap-1.5">
              <PhoneIcon />
              {listing.phone}
            </span>
          )}
          {listing.whatsapp && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <ChatIcon />
              WhatsApp
            </span>
          )}
          {websiteDomain && (
            <span className="inline-flex items-center gap-1.5">
              <GlobeIcon />
              {websiteDomain}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

/**
 * Container that renders a list of <ListingRow /> with dividers and a
 * rounded outer frame. Renders nothing when the list is empty.
 */
export function ListingRowList({
  listings,
  title,
  subtitle,
}: {
  listings: Listing[];
  title?: string;
  subtitle?: string;
}) {
  if (listings.length === 0) return null;
  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-3 flex items-end justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-brand-950">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-neutral-600">{subtitle}</p>
            )}
          </div>
        </div>
      )}
      <ul className="divide-y divide-border overflow-hidden rounded-xl bg-background ring-1 ring-border">
        {listings.map((l) => (
          <li key={l.id}>
            <ListingRow listing={l} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Small middot separator used between inline meta chips on line 1. */
function Sep() {
  return (
    <span className="mx-2 text-neutral-300" aria-hidden>
      ·
    </span>
  );
}

/**
 * Strips protocol, www, and trailing slash for a clean display:
 *   https://www.balticcarrent.lv/ -> balticcarrent.lv
 */
function formatDomain(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

/* Inline icons — kept here to avoid a runtime icon dependency on this hot path. */

function PinIcon() {
  return (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}
