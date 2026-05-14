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
 * Layout (Option 1, "dense row"):
 *   Line 1: Name · Since YYYY  ......................................  View →
 *   Line 2: 50–60 vehicles · short description (1-line clamp)
 *   Line 3: 📍 address · 4.8 km centre · 2.1 km RIX
 *   Line 4: 📞 phone · 💬 WhatsApp · 🌐 website
 *
 * Each metadata line is rendered only if it has at least one piece to show, so
 * rentals with sparse data degrade gracefully without leaving empty lines.
 */
export function ListingRow({ listing }: { listing: Listing }) {
  const city = CITIES.find((c) => c.slug === listing.city);

  const hasFleetCount =
    listing.fleet.countMin > 0 || listing.fleet.countMax > 0;
  const fleetSnippet =
    listing.fleet.description ||
    `Independent local rental in ${city?.name ?? "the Baltics"}.`;

  // Distance chips depend on the listing having coordinates AND the city
  // having an airport / center configured (which is true for all three of
  // RIX/TLL/VNO today).
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

  const hasContactRow = Boolean(
    listing.phone || listing.whatsapp || websiteDomain,
  );
  const hasLocationRow = Boolean(
    listing.address || distanceFromCenterKm != null,
  );

  return (
    <Link
      href={`/c/${listing.slug}`}
      className="group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-surface-soft sm:px-5"
    >
      {/* Line 1: name + since-year, with right-aligned View affordance. */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="truncate text-base font-semibold text-brand-950 group-hover:text-brand-700">
            {listing.name}
          </h3>
          {listing.foundedYear && (
            <span className="shrink-0 text-xs font-medium text-neutral-500">
              · Since {listing.foundedYear}
            </span>
          )}
          <span className="ml-1 hidden shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400 sm:inline">
            {city?.name}
          </span>
        </div>
        <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-700 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-900 sm:inline-flex">
          View profile
          <span aria-hidden>→</span>
        </span>
      </div>

      {/* Line 2: fleet + short description (1-line clamp). */}
      <p className="line-clamp-1 text-sm text-neutral-700">
        {hasFleetCount && (
          <>
            <span className="font-medium text-brand-900">
              {listing.fleet.countMin}–{listing.fleet.countMax} vehicles
            </span>
            <span className="text-neutral-400"> · </span>
          </>
        )}
        {fleetSnippet}
      </p>

      {/* Line 3: address + distance chips. */}
      {hasLocationRow && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          {listing.address && (
            <span className="inline-flex items-center gap-1">
              <PinIcon />
              <span className="max-w-[28rem] truncate">{listing.address}</span>
            </span>
          )}
          {distanceFromCenterKm != null && (
            <span>{formatKm(distanceFromCenterKm)} centre</span>
          )}
          {distanceFromAirportKm != null && city && (
            <span>
              {formatKm(distanceFromAirportKm)} {city.airport.code}
            </span>
          )}
        </div>
      )}

      {/* Line 4: contact channels. */}
      {hasContactRow && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
          {listing.phone && (
            <span className="inline-flex items-center gap-1">
              <PhoneIcon />
              {listing.phone}
            </span>
          )}
          {listing.whatsapp && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <ChatIcon />
              WhatsApp
            </span>
          )}
          {websiteDomain && (
            <span className="inline-flex items-center gap-1">
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

/**
 * Strips protocol, www, and trailing slash for a clean display:
 *   https://www.balticcarrent.lv/ -> balticcarrent.lv
 * Returns undefined if the URL is missing or unparseable.
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

/* Inline icons — kept here to avoid a runtime icon dependency for this hot path. */

function PinIcon() {
  return (
    <svg
      aria-hidden
      width="12"
      height="12"
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
      width="12"
      height="12"
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
      width="12"
      height="12"
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
      width="12"
      height="12"
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
