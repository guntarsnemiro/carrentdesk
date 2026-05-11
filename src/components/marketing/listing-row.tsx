import Link from "next/link";
import { CITIES } from "@/lib/cities";
import type { Listing } from "@/lib/listings-types";

/**
 * Compact, no-image row for *unverified* (unclaimed / claimed-but-not-verified)
 * listings. Used on the city pages and `/all` so the marketplace can carry many
 * rentals without each one needing its own image — and so the visual contrast
 * with verified-card operators is immediate.
 *
 * Mobile: stacks vertically. Desktop: single line with name | fleet | phone.
 */
export function ListingRow({ listing }: { listing: Listing }) {
  const city = CITIES.find((c) => c.slug === listing.city);

  const hasFleetCount =
    listing.fleet.countMin > 0 || listing.fleet.countMax > 0;
  const fleetSnippet =
    listing.fleet.description ||
    `Independent local rental in ${city?.name ?? "the Baltics"}.`;

  return (
    <Link
      href={`/c/${listing.slug}`}
      className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-soft sm:flex-row sm:items-center sm:gap-6 sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate text-base font-semibold text-brand-950 group-hover:text-brand-700">
            {listing.name}
          </h3>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400 sm:inline">
            {city?.name}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-neutral-600">
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
      </div>

      <div className="flex shrink-0 items-center gap-4 text-sm">
        {listing.phone && (
          <span
            className="hidden text-neutral-600 sm:inline"
            aria-label="Phone"
          >
            {listing.phone}
          </span>
        )}
        <span className="inline-flex items-center gap-1 font-medium text-brand-700 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-900">
          View
          <span aria-hidden>→</span>
        </span>
      </div>
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
