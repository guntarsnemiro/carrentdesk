import Link from "next/link";
import { HeroSearch } from "@/components/marketing/hero-search";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { VehicleTypeRow } from "@/components/marketing/vehicle-type-row";
import { FeaturedRentals } from "@/components/marketing/featured-rentals";

// Re-render every 60s so DB updates (new listings, design-partner changes,
// etc.) reach production without manual re-deploys. Pre-pitch we may switch
// to `force-dynamic` for instant freshness.
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />
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
            <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
              Find your best
              <br className="hidden sm:block" /> local car rental.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-100 sm:text-lg">
              Independent local rentals across the Baltics &amp; Scandinavia.
              Direct contact, fair prices, no middleman.
            </p>

            <HeroSearch />
          </div>
        </div>
      </div>
    </section>
  );
}

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Search your city",
    description: "Browse verified independent rental companies near you. Filter by vehicle type, size, and location.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    step: "2",
    title: "Compare & choose",
    description: "See real fleet details, services and contact info. No fake reviews, no inflated prices — just honest listings.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
  {
    step: "3",
    title: "Contact directly",
    description: "Call, WhatsApp or email the rental company directly. No booking fees, no middleman — deal straight with the owner.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          How CarRentDesk works
        </h2>
        <p className="mt-3 text-base text-neutral-500">
          Skip the big platforms. Find and contact local rentals directly.
        </p>
      </div>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {HOW_IT_WORKS.map((item) => (
          <div key={item.step} className="flex flex-col items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">Step {item.step}</p>
              <h3 className="mt-1 text-lg font-semibold text-brand-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link href="/all" className="text-sm font-medium text-brand-700 hover:text-brand-900">
          Browse all cities →
        </Link>
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
            href="/join"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
          >
            Start free trial →
          </Link>
          <Link
            href="/app/login"
            className="inline-flex items-center justify-center rounded-full border border-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-900"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
