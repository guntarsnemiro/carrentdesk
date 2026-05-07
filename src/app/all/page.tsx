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

export const metadata: Metadata = {
  title: "All car rentals across the Baltics",
  description:
    "Browse every independent car rental on CarRentDesk — Riga, Tallinn, and Vilnius. Direct contact, no commission.",
  alternates: { canonical: "/all" },
};

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function AllPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const activeType = isValidVehicleType(type) ? type : undefined;
  const listings = await filterListings({ vehicleType: activeType });
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
            <span className="text-neutral-700">All cities</span>
          </nav>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                {CITIES.map((c) => c.name).join(" · ")}
              </p>
              <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                All Baltic car rentals
                {activeMeta && (
                  <span className="text-neutral-400"> · {activeMeta.label}</span>
                )}
              </h1>
              <p className="mt-2 max-w-2xl text-base text-neutral-600">
                Every independent rental on CarRentDesk, across Riga, Tallinn,
                and Vilnius.
              </p>
            </div>
          </div>

          <FilterChips activeType={activeType} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
        {listings.length === 0 ? (
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
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

function FilterChips({ activeType }: { activeType?: VehicleType }) {
  return (
    <div className="mt-5 -mx-1 flex flex-wrap items-center gap-1.5 overflow-x-auto px-1 pb-1">
      <Chip href="/all" active={!activeType}>
        All types
      </Chip>
      {VEHICLE_TYPES.map((v) => (
        <Chip
          key={v.key}
          href={`/all?type=${v.key}`}
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
