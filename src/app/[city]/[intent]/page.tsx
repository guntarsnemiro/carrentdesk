import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { filterListings } from "@/lib/listings";
import { CityListingsView } from "@/components/marketing/city-listings-view";
import { getAllIntentParams, getIntentBySlug, getIntentsForCity, YEAR } from "@/lib/seo/intents";

// SEO landing pages over static data — daily regeneration is plenty.
export const revalidate = 86400; // 24 hours

type PageProps = {
  params: Promise<{ city: string; intent: string }>;
};

export function generateStaticParams() {
  return getAllIntentParams(CITIES);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug, intent: intentSlug } = await params;
  const city = getCityBySlug(citySlug);
  const intent = getIntentBySlug(intentSlug);
  if (!city || !intent) return {};

  // Guard: airport-only pages for cities without airports should 404
  if (intent.requiresAirport && !city.airport) return {};

  const title = intent.metaTitle(city, YEAR);
  const description = intent.metaDescription(city);
  const url = `/${city.slug}/${intent.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

export default async function IntentPage({ params }: PageProps) {
  const { city: citySlug, intent: intentSlug } = await params;
  const city = getCityBySlug(citySlug);
  const intent = getIntentBySlug(intentSlug);

  if (!city || !intent) notFound();
  if (intent.requiresAirport && !city.airport) notFound();

  const listings = await filterListings({ city: citySlug });
  const verifiedCount = listings.filter((l) => l.status === "verified").length;
  const faqs = intent.faqs(city);

  /* ── Structured data ── */
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://carrentdesk.com/" },
      { "@type": "ListItem", position: 2, name: city.country, item: `https://carrentdesk.com/${city.slug}` },
      { "@type": "ListItem", position: 3, name: city.name, item: `https://carrentdesk.com/${city.slug}` },
      { "@type": "ListItem", position: 4, name: intent.h1(city, YEAR), item: `https://carrentdesk.com/${city.slug}/${intent.slug}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const otherIntents = getIntentsForCity(city).filter((i) => i.slug !== intent.slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── Hero / Header ── */}
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-900">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <span>{city.country}</span>
            <span aria-hidden className="mx-2">/</span>
            <Link href={`/${city.slug}`} className="hover:text-brand-900">{city.name}</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-neutral-700">{intent.h1(city, YEAR)}</span>
          </nav>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                {city.country}
              </p>
              <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                {intent.h1(city, YEAR)}
              </h1>
              <p className="mt-2 text-base text-neutral-600">
                {intent.intro(city)}
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

      {/* ── Listings ── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        {listings.length === 0 ? (
          <EmptyState cityName={city.name} />
        ) : (
          <CityListingsView
            listings={listings}
            cityName={city.name}
            mapFallbackCenter={city.center}
          />
        )}
      </section>

      {/* ── Why local ── */}
      <section className="border-t border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-8">
          <h2 className="text-xl font-semibold text-brand-950">
            Why rent from a local company in {city.name}?
          </h2>
          <p className="mt-3 text-neutral-600 leading-relaxed">
            {intent.whyLocal(city)}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoCard
              title="Direct contact"
              body="Phone, WhatsApp, or email — reach the actual rental company, not a call centre."
            />
            <InfoCard
              title="No booking fees"
              body="CarRentDesk charges nothing to browse or contact. Prices are set by the operator."
            />
            <InfoCard
              title="Flexible terms"
              body="Local companies are far more flexible on pickup times, drop-off, and special requests."
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-8">
          <h2 className="text-xl font-semibold text-brand-950 mb-6">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-border">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-medium text-brand-950">
                  {q}
                  <span className="mt-0.5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Related pages ── */}
      <section className="border-t border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 mb-3">
            More {city.name} car rental guides
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${city.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
            >
              All {city.name} rentals →
            </Link>
            {otherIntents.map((i) => (
              <Link
                key={i.slug}
                href={`/${city.slug}/${i.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
              >
                {i.h1(city, YEAR).replace(` ${YEAR}`, "")} →
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Other cities ── */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 mb-3">
            {intent.h1(city, YEAR).replace(city.name, "").replace(String(YEAR), "").trim()} in other cities
          </p>
          <div className="flex flex-wrap gap-2">
            {CITIES.filter(
              (c) => c.slug !== city.slug && getIntentsForCity(c).some((i) => i.slug === intent.slug)
            ).map((other) => (
              <Link
                key={other.slug}
                href={`/${other.slug}/${intent.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
              >
                {other.name} →
              </Link>
            ))}
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

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-background p-4 ring-1 ring-border">
      <p className="text-sm font-semibold text-brand-950">{title}</p>
      <p className="mt-1 text-sm text-neutral-600">{body}</p>
    </div>
  );
}

function EmptyState({ cityName }: { cityName: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-soft p-10 text-center">
      <h2 className="text-lg font-semibold text-brand-950">
        No listings yet for {cityName}
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        We&apos;re growing the network here.{" "}
        <Link href="/for-rentals" className="text-brand-700 hover:underline">
          List your rental company
        </Link>{" "}
        if you operate in {cityName} — it&apos;s free.
      </p>
    </div>
  );
}
