import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES } from "@/lib/cities";
import { haversineKm } from "@/lib/geo";
import {
  AMENITY_LABELS,
  getAllListingSlugs,
  getListingBySlug,
  type AmenityKey,
  type Listing,
} from "@/lib/listings";
import { LocationMapLoader } from "@/components/marketing/location-map-loader";
import { ClaimSidebarCard } from "./_components/claim-banner";

// Re-render company profiles every 60s so operator edits surface fast.
export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllListingSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return {};

  const city = CITIES.find((c) => c.slug === listing.city);
  const title = `${listing.name} — Car rental in ${city?.name ?? ""}`;
  const description =
    listing.description ??
    `${listing.fleet.description} Located in ${city?.name ?? listing.city}.`;

  return {
    title,
    description,
    alternates: { canonical: `/c/${listing.slug}` },
    openGraph: { title, description, url: `/c/${listing.slug}` },
  };
}

const ALL_AMENITIES: AmenityKey[] = Object.keys(AMENITY_LABELS) as AmenityKey[];

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const city = CITIES.find((c) => c.slug === listing.city);
  const verified = listing.status === "verified";
  const claimed = listing.status === "claimed" || verified;
  const profileUrl = `https://carrentdesk.com/c/${listing.slug}`;

  // Schema.org CarRental for rich-results eligibility on Google. Falls back
  // gracefully when fields aren't available (we don't emit nulls).
  const businessJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CarRental",
    name: listing.name,
    url: profileUrl,
    image: `${profileUrl}/opengraph-image`,
    ...(listing.description && { description: listing.description }),
    ...(listing.phone && { telephone: listing.phone }),
    ...(listing.email && claimed && { email: listing.email }),
    ...(listing.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: listing.address,
        addressLocality: city?.name,
        addressCountry: city?.countryCode,
      },
    }),
    ...(listing.coordinates && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: listing.coordinates.lat,
        longitude: listing.coordinates.lng,
      },
    }),
    ...(listing.website && { sameAs: [listing.website] }),
    ...(listing.foundedYear && { foundingDate: String(listing.foundedYear) }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://carrentdesk.com/",
      },
      ...(city
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: city.name,
              item: `https://carrentdesk.com/${city.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: city ? 3 : 2,
        name: listing.name,
        item: profileUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-900">
              Home
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <Link href={`/${listing.city}`} className="hover:text-brand-900">
              {city?.name}
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-neutral-700">{listing.name}</span>
          </nav>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
                  {listing.name}
                </h1>
                {verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-900 shadow-sm ring-1 ring-brand-200">
                    <span aria-hidden className="size-1.5 rounded-full bg-success" />
                    Verified operator
                  </span>
                )}
              </div>
              {listing.address && (
                <p className="mt-2 text-base text-neutral-600">{listing.address}</p>
              )}
              {listing.googleRating && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-800 shadow-sm ring-1 ring-border">
                    <span className="text-amber-400">★</span>
                    <span>{listing.googleRating.toFixed(1)}</span>
                    {listing.googleReviews && (
                      <span className="text-neutral-500">({listing.googleReviews} reviews)</span>
                    )}
                  </div>
                  {listing.googleUrl && (
                    <a
                      href={listing.googleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-neutral-500 hover:text-brand-700 hover:underline"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              )}
              {listing.description && (
                <p className="mt-4 max-w-2xl text-lg leading-7 text-neutral-700">
                  {listing.description}
                </p>
              )}
            </div>

            <ContactCTAs listing={listing} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-10">
            <FleetBlock listing={listing} />
            <AmenitiesBlock amenities={listing.amenities} />
          </div>

          <aside className="space-y-6">
            {!claimed && (
              <ClaimSidebarCard companyId={listing.id} companyName={listing.name} />
            )}
            <SidebarCard title="Contact directly">
              <ul className="space-y-3 text-sm">
                {listing.phone && (
                  <li>
                    <span className="text-neutral-500">Phone</span>
                    <br />
                    <a href={`tel:${listing.phone.replace(/\s+/g, "")}`} className="font-medium text-brand-900 hover:underline">
                      {listing.phone}
                    </a>
                  </li>
                )}
                {listing.whatsapp && (
                  <li>
                    <span className="text-neutral-500">WhatsApp</span>
                    <br />
                    <a
                      href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`}
                      className="font-medium text-brand-900 hover:underline"
                    >
                      {listing.whatsapp}
                    </a>
                  </li>
                )}
                {listing.email && claimed && (
                  <li>
                    <span className="text-neutral-500">Email</span>
                    <br />
                    <a href={`mailto:${listing.email}`} className="font-medium text-brand-900 hover:underline">
                      {listing.email}
                    </a>
                  </li>
                )}
                {listing.website && (
                  <li>
                    <span className="text-neutral-500">Website</span>
                    <br />
                    <a
                      href={listing.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-900 hover:underline"
                    >
                      {prettyUrl(listing.website)}
                    </a>
                  </li>
                )}
              </ul>
            </SidebarCard>

            <SidebarCard title="Location">
              <p className="text-sm text-neutral-700">
                {listing.address ?? `${city?.name}, ${city?.country}`}
              </p>
              {listing.coordinates && city && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
                  {(() => {
                    const distCenter = haversineKm(
                      listing.coordinates,
                      { lat: city.center[0], lng: city.center[1] },
                    );
                    return (
                      <>
                        <span>🏙️ {distCenter.toFixed(1)} km from city centre</span>
                        {city.airport && (
                          <span>✈️ {haversineKm(listing.coordinates, { lat: city.airport.lat, lng: city.airport.lng }).toFixed(1)} km from {city.airport.code}</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
              {listing.coordinates ? (
                <LocationMapLoader
                  lat={listing.coordinates.lat}
                  lng={listing.coordinates.lng}
                  label={listing.name}
                />
              ) : (
                <div
                  aria-hidden
                  className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg ring-1 ring-border"
                  style={{ background: city?.gradient }}
                >
                  {city?.photoUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${city.photoUrl}')` }}
                    />
                  )}
                </div>
              )}
            </SidebarCard>
          </aside>
        </div>
      </section>
    </>
  );
}

function ContactCTAs({ listing }: { listing: Listing | null }) {
  if (!listing) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {listing.phone && (
        <a
          href={`tel:${listing.phone.replace(/\s+/g, "")}`}
          className="inline-flex items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          Call {listing.phone}
        </a>
      )}
      {listing.whatsapp && (
        <a
          href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`}
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-surface-soft"
        >
          WhatsApp
        </a>
      )}
      {listing.website && (
        <a
          href={listing.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-surface-soft"
        >
          Visit website
        </a>
      )}
    </div>
  );
}

function FleetBlock({ listing }: { listing: Listing | null }) {
  if (!listing) return null;

  const hasFleetCount =
    listing.fleet.countMin > 0 || listing.fleet.countMax > 0;
  const fleetText =
    listing.fleet.description ||
    "Independent local rental. Contact directly for the current fleet, availability, and rates.";

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-brand-950">
        Fleet overview
      </h2>
      <div className="mt-4 rounded-2xl bg-background p-6 ring-1 ring-border">
        {hasFleetCount && (
          <p className="text-3xl font-semibold tracking-tight text-brand-900">
            {listing.fleet.countMin}–{listing.fleet.countMax}
            <span className="ml-2 text-base font-medium text-neutral-500">
              vehicles
            </span>
          </p>
        )}
        <p
          className={`${hasFleetCount ? "mt-3" : ""} text-base leading-7 text-neutral-700`}
        >
          {fleetText}
        </p>
        {listing.status !== "verified" && (
          <p className="mt-4 text-xs text-neutral-500">
            Per-vehicle pricing and photos appear once the rental joins our
            verified-operator program.
          </p>
        )}
      </div>
    </div>
  );
}

function AmenitiesBlock({ amenities }: { amenities: AmenityKey[] }) {
  // When we have no amenity data for a listing yet, don't render a grid of
  // grey-dot "we don't offer this" rows — that misrepresents the operator.
  // Instead, show a single neutral line that nudges the visitor to call.
  if (amenities.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-brand-950">
          Services & amenities
        </h2>
        <div className="mt-4 rounded-2xl bg-background p-6 ring-1 ring-border">
          <p className="text-sm leading-6 text-neutral-600">
            Service details (airport pickup, delivery, child seats, etc.) are
            still being verified for this rental. Contact them directly to
            confirm what they offer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-brand-950">
        Services & amenities
      </h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {ALL_AMENITIES.map((key) => {
          const has = amenities.includes(key);
          return (
            <li
              key={key}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                has
                  ? "bg-background text-brand-950 ring-1 ring-border"
                  : "text-neutral-400"
              }`}
            >
              <span
                aria-hidden
                className={`grid size-5 place-items-center rounded-full text-xs ${
                  has
                    ? "bg-success/10 text-success"
                    : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {has ? "✓" : "·"}
              </span>
              {AMENITY_LABELS[key]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-background p-6 ring-1 ring-border">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
