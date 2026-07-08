import type { Metadata } from "next";
import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { filterListings } from "@/lib/listings";
import {
  VEHICLE_TYPES,
  getVehicleType,
  type VehicleType,
} from "@/lib/vehicle-types";
import { ListingCard } from "@/components/marketing/listing-card";
import { ListingRowList } from "@/components/marketing/listing-row";

// Listings change only on re-scrape; hourly regeneration is plenty.
export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
  title: "All car rentals across Europe",
  description:
    "Browse 6,500+ independent local car rentals across Europe on CarRentDesk. Direct contact, no booking fees.",
  alternates: { canonical: "/all" },
};

type PageProps = {
  searchParams: Promise<{ type?: string; city?: string }>;
};

export default async function AllPage({ searchParams }: PageProps) {
  const { type, city } = await searchParams;
  const activeType = isValidVehicleType(type) ? type : undefined;
  const activeCity = CITIES.find((c) => c.slug === city)?.slug;
  const activeMeta = activeType ? getVehicleType(activeType) : undefined;
  const activeCityMeta = CITIES.find((c) => c.slug === activeCity);

  // Never load all 6,500 listings into one HTML page — Googlebot's 2 MB limit
  // and page weight. Listings render only when a city filter is selected.
  const listings = activeCity
    ? await filterListings({ vehicleType: activeType, city: activeCity })
    : [];

  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-900">
              Home
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-neutral-700">All cities</span>
          </nav>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                {activeCityMeta
                  ? `Car rentals in ${activeCityMeta.name}`
                  : "All car rentals"}
                {activeMeta && (
                  <span className="text-neutral-400"> · {activeMeta.label}</span>
                )}
              </h1>
              <p className="mt-2 max-w-2xl text-base text-neutral-600">
                {activeCityMeta
                  ? `Independent local rentals in ${activeCityMeta.name}. Direct contact, no commission.`
                  : "6,500+ independent local car rentals across Europe. Direct contact, no booking fees."}
              </p>
            </div>
          </div>

          <CityChips activeCity={activeCity} activeType={activeType} />
          <FilterChips activeType={activeType} activeCity={activeCity} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        {!activeCity ? (
          <div>
            <p className="text-base text-neutral-600">
              Select a city below to browse local rental companies.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CITIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/all?city=${c.slug}${activeType ? `&type=${activeType}` : ""}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
                >
                  <span>
                    {c.name}
                    <span className="ml-1.5 font-normal text-neutral-500">{c.country}</span>
                  </span>
                  <span aria-hidden className="text-neutral-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-soft p-10 text-center">
            <h2 className="text-lg font-semibold text-brand-950">
              No rentals match this filter yet
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Try a different car type, or{" "}
              <Link href="/" className="text-brand-700 hover:underline">
                go back to the homepage
              </Link>
              .
            </p>
          </div>
        ) : (
          (() => {
            const verified = listings.filter((l) => l.status === "verified");
            const rest = listings.filter((l) => l.status !== "verified");
            return (
              <div className="space-y-10">
                {verified.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-brand-950">
                      Verified rentals
                    </h2>
                    <p className="mt-0.5 text-sm text-neutral-600">
                      Operators on the CarRentDesk operations platform.
                    </p>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {verified.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  </div>
                )}
                {rest.length > 0 && (
                  <ListingRowList
                    listings={rest}
                    title={
                      verified.length > 0
                        ? "Other rentals"
                        : `Rentals in ${activeCityMeta?.name ?? "Europe"}`
                    }
                    subtitle="Independent operators we've listed. Contact them directly."
                  />
                )}
              </div>
            );
          })()
        )}

        <div className="mt-12 rounded-2xl bg-surface-soft p-6 ring-1 ring-border">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            Browse by city
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
              >
                {c.name}
                <span aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// Group cities by region for the filter row
const BALTIC_SLUGS = new Set(["riga", "tallinn", "vilnius", "parnu", "kaunas"]);

function CityChips({ activeCity, activeType }: { activeCity?: string; activeType?: VehicleType }) {
  const typeParam = activeType ? `&type=${activeType}` : "";

  const baltic = CITIES.filter((c) => BALTIC_SLUGS.has(c.slug));
  const scandi = CITIES.filter((c) => !BALTIC_SLUGS.has(c.slug));

  return (
    <div className="mt-5 -mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max items-center gap-1.5">
        <Chip href={`/all${activeType ? `?type=${activeType}` : ""}`} active={!activeCity}>
          All cities
        </Chip>
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
        <span className="mr-1 shrink-0 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Baltics</span>
        {baltic.map((c) => (
          <Chip
            key={c.slug}
            href={`/all?city=${c.slug}${typeParam}`}
            active={activeCity === c.slug}
          >
            {c.name}
          </Chip>
        ))}
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
        <span className="mr-1 shrink-0 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Scandinavia</span>
        {scandi.map((c) => (
          <Chip
            key={c.slug}
            href={`/all?city=${c.slug}${typeParam}`}
            active={activeCity === c.slug}
          >
            {c.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function FilterChips({ activeType, activeCity }: { activeType?: VehicleType; activeCity?: string }) {
  const cityParam = activeCity ? `&city=${activeCity}` : "";
  return (
    <div className="mt-2 -mx-1 flex flex-wrap items-center gap-1.5 overflow-x-auto px-1 pb-1">
      <Chip href={`/all${activeCity ? `?city=${activeCity}` : ""}`} active={!activeType}>
        All types
      </Chip>
      {VEHICLE_TYPES.map((v) => (
        <Chip
          key={v.key}
          href={`/all?type=${v.key}${cityParam}`}
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

function isValidVehicleType(t: string | undefined): t is VehicleType {
  if (!t) return false;
  return VEHICLE_TYPES.some((v) => v.key === t);
}
