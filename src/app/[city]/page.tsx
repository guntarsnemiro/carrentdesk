import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { filterListings } from "@/lib/listings";
import {
  VEHICLE_TYPES,
  getVehicleType,
  type VehicleType,
} from "@/lib/vehicle-types";
import { CityListingsView } from "@/components/marketing/city-listings-view";

// Re-render every 60s so DB updates surface without a manual redeploy.
export const revalidate = 60;

type PageProps = {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ type?: string }>;
};

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};

  const title = `Car rentals in ${city.name}, ${city.country}`;
  const description = `Browse local car rental companies in ${city.name}. ${city.tagline}. Direct contact, fair prices, no middleman.`;

  return {
    title,
    description,
    alternates: { canonical: `/${city.slug}` },
    openGraph: { title, description, url: `/${city.slug}` },
  };
}

export default async function CityPage({ params, searchParams }: PageProps) {
  const { city: slug } = await params;
  const { type } = await searchParams;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const activeType = isValidVehicleType(type) ? type : undefined;
  const listings = await filterListings({ city: slug, vehicleType: activeType });
  const verifiedCount = listings.filter((l) => l.status === "verified").length;
  const activeMeta = activeType ? getVehicleType(activeType) : undefined;

  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-900">
              Home
            </Link>
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
                {activeMeta && (
                  <span className="text-neutral-400"> · {activeMeta.label}</span>
                )}
              </h1>
              <p className="mt-2 max-w-2xl text-base text-neutral-600">
                {city.tagline}. Direct phone, WhatsApp, and email — contact the
                rental directly.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-sm">
              <Stat label="Listings" value={String(listings.length)} />
              <Stat label="Verified" value={String(verifiedCount)} accent />
              <Stat
                label="Updated"
                value={new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              />
            </div>
          </div>

          <FilterChips citySlug={city.slug} activeType={activeType} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        {listings.length === 0 ? (
          <EmptyState cityName={city.name} activeMeta={activeMeta} />
        ) : (
          <CityListingsView
            listings={listings}
            cityName={city.name}
            mapFallbackCenter={city.center}
          />
        )}

        <div className="mt-12 rounded-2xl bg-surface-soft p-6 ring-1 ring-border">
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

function FilterChips({
  citySlug,
  activeType,
}: {
  citySlug: string;
  activeType?: VehicleType;
}) {
  return (
    <div className="mt-5 -mx-1 flex flex-wrap items-center gap-1.5 overflow-x-auto px-1 pb-1">
      <Chip href={`/${citySlug}`} active={!activeType}>
        All types
      </Chip>
      {VEHICLE_TYPES.map((v) => (
        <Chip
          key={v.key}
          href={`/${citySlug}?type=${v.key}`}
          active={activeType === v.key}
        >
          {v.label}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-900 bg-brand-900 text-white"
          : "border-border bg-background text-brand-900 hover:bg-brand-50"
      }`}
    >
      {children}
    </Link>
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
    <div className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span
        className={`text-xl font-semibold tracking-tight ${
          accent ? "text-success" : "text-brand-950"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  cityName,
  activeMeta,
}: {
  cityName: string;
  activeMeta?: ReturnType<typeof getVehicleType>;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-soft p-10 text-center">
      <h2 className="text-lg font-semibold text-brand-950">
        {activeMeta
          ? `No ${activeMeta.label.toLowerCase()} rentals listed yet in ${cityName}`
          : `No listings yet for ${cityName}`}
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        We&apos;re actively adding rentals here. Try another car type, or{" "}
        <Link href="/for-rentals" className="text-brand-700 hover:underline">
          list your rental
        </Link>{" "}
        if you operate in {cityName}.
      </p>
    </div>
  );
}

function isValidVehicleType(t: string | undefined): t is VehicleType {
  if (!t) return false;
  return VEHICLE_TYPES.some((v) => v.key === t);
}
