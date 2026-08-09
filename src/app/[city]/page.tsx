import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { filterListings } from "@/lib/listings";
import { isReservedRootSlug } from "@/lib/reserved-slugs";
import { CityListingsView } from "@/components/marketing/city-listings-view";
import { getIntentsForCity, YEAR } from "@/lib/seo/intents";

// City listings change only on re-scrape. Pages are prerendered at build
// (free), and revalidation that finds no change costs no ISR write — a weekly
// interval just trims background function invocations.
export const revalidate = 604800; // 7 days

type PageProps = {
  params: Promise<{ city: string }>;
};

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params;
  if (isReservedRootSlug(slug)) return {};
  const city = getCityBySlug(slug);
  if (!city) return {};

  const title = `Car rentals in ${city.name}, ${city.country}`;
  const description = `Browse local car rental companies in ${city.name}. ${city.tagline}. Direct contact, fair prices, no middleman.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city.slug}` },
    openGraph: {
      title,
      description,
      url: `/${city.slug}`,
      images: [{ url: `/${city.slug}/opengraph-image`, width: 1200, height: 630, alt: `Car rentals in ${city.name} — CarRentDesk`, type: "image/png" }],
    },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city: slug } = await params;
  if (isReservedRootSlug(slug)) notFound();
  const city = getCityBySlug(slug);
  if (!city) notFound();

  // Fetch ALL listings — vehicle-type filtering happens client-side in
  // CityListingsView so this page stays statically cached (no searchParams).
  const listings = await filterListings({ city: slug });
  const verifiedCount = listings.filter((l) => l.status === "verified").length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://carrentdesk.com/" },
      { "@type": "ListItem", position: 2, name: city.country, item: `https://carrentdesk.com/${city.slug}` },
      { "@type": "ListItem", position: 3, name: city.name, item: `https://carrentdesk.com/${city.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-900">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <span>{city.country}</span>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-neutral-700">{city.name}</span>
          </nav>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                {city.country}
              </p>
              <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                Car rentals in {city.name}
              </h1>
              <p className="mt-2 max-w-2xl text-base text-neutral-600">
                {city.tagline}. Direct phone, WhatsApp, and email — contact the rental directly.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-sm">
              <Stat label="Listings" value={String(listings.length)} />
              <Stat label="Verified" value={String(verifiedCount)} accent />
              <Stat
                label="Updated"
                value={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        <CityListingsView
          listings={listings}
          cityName={city.name}
          citySlug={city.slug}
          mapFallbackCenter={city.center}
        />

        <div className="mt-8 rounded-2xl bg-surface-soft p-6 ring-1 ring-border">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            {city.name} car rental guides
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {getIntentsForCity(city).map((intent) => (
              <Link
                key={intent.slug}
                href={`/${city.slug}/${intent.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
              >
                {intent.h1(city, YEAR).replace(` ${YEAR}`, "")}
                <span aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-surface-soft p-6 ring-1 ring-border">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            Other cities
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CITIES.filter((c) => c.slug !== city.slug).map((other) => (
              <Link
                key={other.slug}
                href={`/${other.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
              >
                {other.name}
                <span aria-hidden>→</span>
              </Link>
            ))}
            <Link
              href="/all"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
            >
              All cities
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
      <span className={`text-xl font-semibold tracking-tight ${accent ? "text-success" : "text-brand-950"}`}>
        {value}
      </span>
    </div>
  );
}
