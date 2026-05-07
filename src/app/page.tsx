import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { HeroSearch } from "@/components/marketing/hero-search";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { VehicleTypeRow } from "@/components/marketing/vehicle-type-row";
import { FeaturedRentals } from "@/components/marketing/featured-rentals";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <CitiesRow />
      <VehicleTypeRow />
      <FeaturedRentals />
      <ForOwnersStrip />
    </>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-4 lg:px-8 lg:pt-6">
      <div className="relative isolate overflow-hidden rounded-2xl shadow-sm sm:rounded-3xl">
        {/* Layer 1: navy gradient fallback */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            background:
              "linear-gradient(135deg, #081a3a 0%, #0f2a52 45%, #1d3771 100%)",
          }}
        />
        {/* Layer 2: car photo (Unsplash). Fails gracefully back to gradient. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-55"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=70')",
          }}
        />
        {/* Layer 3: dark overlay for text contrast */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,26,58,0.55) 0%, rgba(8,26,58,0.75) 70%, rgba(8,26,58,0.88) 100%)",
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-16 lg:px-8 lg:pt-24 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
              Riga · Tallinn · Vilnius
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
              Find your best
              <br className="hidden sm:block" /> local car rent company.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-100 sm:text-lg">
              Independent local rentals across the Baltics. Direct contact,
              fair prices, no commission.
            </p>

            <HeroSearch />
          </div>
        </div>
      </div>
    </section>
  );
}

function CitiesRow() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          Browse by city
        </h2>
        <Link
          href="/all"
          className="hidden text-sm font-medium text-brand-700 hover:text-brand-900 sm:inline"
        >
          All cities →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CITIES.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-xl text-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{ background: c.gradient }}
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]"
              style={{ backgroundImage: `url('${c.photoUrl}')` }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/15"
            />
            <div className="relative z-10 p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/80">
                {c.country}
              </p>
              <h3 className="mt-0.5 text-2xl font-semibold tracking-tight">
                {c.name}
              </h3>
              <p className="mt-1 line-clamp-1 text-sm text-white/85">
                {c.tagline}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium">
                {c.placeholderCount} rentals
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ForOwnersStrip() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-950 px-6 py-6 text-white sm:flex-row sm:items-center sm:px-8 sm:py-5">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">
            For rental owners
          </p>
          <p className="text-base font-semibold sm:text-lg">
            Run a smarter rental. Get found by more customers.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/for-rentals"
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-950 transition-colors hover:bg-brand-100"
          >
            Learn more
          </Link>
          <Link
            href="/for-rentals#claim"
            className="inline-flex items-center justify-center rounded-full border border-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-900"
          >
            Claim your listing
          </Link>
        </div>
      </div>
    </section>
  );
}
