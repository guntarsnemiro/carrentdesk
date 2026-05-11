import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { AMENITY_LABELS, type Listing } from "@/lib/listings-types";

const TOP_AMENITIES_TO_SHOW = 3;

/**
 * Visual card used for *verified* operators on the homepage and city pages.
 * Renders the operator's own logo on a clean surface (no city photo) so each
 * verified rental looks distinct rather than sharing a stock city background.
 *
 * Unverified rentals use the more compact <ListingRow /> component.
 */
export function ListingCard({ listing }: { listing: Listing }) {
  const city = CITIES.find((c) => c.slug === listing.city);
  const verified = listing.status === "verified";
  const topAmenities = listing.amenities.slice(0, TOP_AMENITIES_TO_SHOW);
  const moreCount = Math.max(0, listing.amenities.length - TOP_AMENITIES_TO_SHOW);

  const hasFleetCount =
    listing.fleet.countMin > 0 || listing.fleet.countMax > 0;
  const fleetText =
    listing.fleet.description ||
    `Independent local rental in ${city?.name ?? "the Baltics"}. Contact directly for current fleet and rates.`;

  // Verified + has logo  -> clean logo header
  // Otherwise            -> city photo (legacy look, used for `claimed` only;
  //                         unverified listings are rendered as rows instead)
  const useLogoHeader = verified && Boolean(listing.logoUrl);

  return (
    <Link
      href={`/c/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-background ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200"
    >
      {useLogoHeader ? (
        <div className="relative isolate flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-surface-soft px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.logoUrl}
            alt={`${listing.name} logo`}
            className="max-h-[60%] max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-medium text-brand-900 shadow-sm ring-1 ring-brand-200">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Verified
          </span>
          <span className="absolute bottom-3 left-3 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
            {city?.name}
          </span>
        </div>
      ) : (
        <div
          className="relative isolate aspect-[16/10] w-full overflow-hidden"
          style={{ background: city?.gradient ?? "var(--color-brand-900)" }}
        >
          {city?.photoUrl && (
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]"
              style={{ backgroundImage: `url('${city.photoUrl}')` }}
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
          />
          {verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-medium text-brand-900 shadow-sm ring-1 ring-brand-200">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              Verified
            </span>
          )}
          <span className="absolute bottom-3 left-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/85">
            {city?.name}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-brand-950 group-hover:text-brand-700">
          {listing.name}
        </h3>
        {listing.address && (
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {listing.address}
          </p>
        )}

        <p className="mt-2 line-clamp-2 text-sm leading-5 text-neutral-700">
          {hasFleetCount && (
            <>
              <span className="font-medium text-brand-900">
                {listing.fleet.countMin}–{listing.fleet.countMax} vehicles
              </span>
              <span className="text-neutral-400"> · </span>
            </>
          )}
          {fleetText}
        </p>

        {topAmenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topAmenities.map((key) => (
              <span
                key={key}
                className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] text-neutral-700 ring-1 ring-border"
              >
                {AMENITY_LABELS[key]}
              </span>
            ))}
            {moreCount > 0 && (
              <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] text-neutral-500 ring-1 ring-border">
                +{moreCount} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
