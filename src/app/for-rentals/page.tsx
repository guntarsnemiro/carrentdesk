import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For rental owners — Run a smarter rental",
  description:
    "CarRentDesk gives independent car rental companies the operations tools the big players keep to themselves. Pickup/return inspections, marketplace listing, founding-partner pricing.",
};

export default function ForRentalsPage() {
  return (
    <>
      <Hero />
      <ProblemBlock />
      <FeatureBlock />
      <ClaimSection />
      <PricingTeaser />
    </>
  );
}

function Hero() {
  return (
    <section className="bg-brand-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-200">
          For rental owners
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Stop losing
          <br />
          damage disputes.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-brand-100">
          CarRentDesk is an operations platform built for independent rental
          companies — starting with the pickup and return inspection tool that
          finally settles damage disputes the right way. Plus a free
          marketplace listing that brings local customers your way.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="#claim"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-brand-950 transition-colors hover:bg-brand-100"
          >
            Claim your listing
          </Link>
          <Link
            href="#pricing"
            className="inline-flex items-center justify-center rounded-full border border-brand-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-900"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProblemBlock() {
  const problems = [
    {
      title: "Disputes you keep losing",
      body: "A customer claims the scratch was already there. Your handwritten checklist doesn't help. Insurance denies the claim. You eat the cost.",
    },
    {
      title: "Customers who can't find you",
      body: "Big aggregators bury independent rentals under sponsored Sixt and Hertz listings. Local customers searching for a fair deal never see your company.",
    },
    {
      title: "Spreadsheets that fall apart",
      body: "Bookings in WhatsApp, fleet records in Excel, photos in your phone gallery. Every audit, every dispute, every staff change — it falls apart.",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <h2 className="text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
        The three things bleeding independent rentals dry
      </h2>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {problems.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl bg-surface-soft p-6 ring-1 ring-border"
          >
            <h3 className="text-lg font-semibold text-brand-950">{p.title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureBlock() {
  const features = [
    {
      eyebrow: "Inspection tool",
      title: "Pickup & return inspections that win disputes",
      body:
        "Tap-to-pin damage marking on a vehicle silhouette. Photos compressed and uploaded automatically. Inspections lock the moment they're submitted, with a full audit trail. Hand the customer a signed PDF before they leave the lot.",
    },
    {
      eyebrow: "Marketplace listing",
      title: "Free listing on carrentdesk.com",
      body:
        "Your company on a clean, fast marketplace built for local customers. Direct phone, WhatsApp, and email contact — no commissions, no markups. Verified operators stand out with a trust badge.",
    },
    {
      eyebrow: "Coming soon",
      title: "The full rental OS",
      body:
        "Bookings, customer records, fleet maintenance, financial dashboards, automation — the same operational layer the big chains have, built for independents. Free during MVP for design partners.",
    },
  ];

  return (
    <section className="bg-surface-soft py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-background p-8 ring-1 ring-border"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                {f.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-brand-950">
                {f.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-neutral-700">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClaimSection() {
  return (
    <section id="claim" className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Already on CarRentDesk?
          </h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-neutral-700">
            We&apos;ve listed independent rental companies across the Baltics
            so customers can find you in one place. If your business is
            already on our marketplace, claim your listing to add photos, edit
            your description, and unlock the operations tools.
          </p>
        </div>
        <div className="rounded-2xl bg-brand-950 p-8 text-white">
          <h3 className="text-xl font-semibold tracking-tight">
            How claiming works
          </h3>
          <ol className="mt-4 space-y-3 text-sm text-brand-100">
            <li>
              <span className="mr-2 font-semibold text-white">1.</span>
              Email{" "}
              <a
                href="mailto:info@carrentdesk.com"
                className="underline underline-offset-2"
              >
                info@carrentdesk.com
              </a>{" "}
              from your business email.
            </li>
            <li>
              <span className="mr-2 font-semibold text-white">2.</span>
              We send a one-click claim link to that address.
            </li>
            <li>
              <span className="mr-2 font-semibold text-white">3.</span>
              You log in, edit your listing, and add photos.
            </li>
            <li>
              <span className="mr-2 font-semibold text-white">4.</span>
              Optionally: turn on the inspection tool and become a verified
              operator.
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-8"
    >
      <div className="overflow-hidden rounded-3xl bg-surface-soft px-8 py-12 ring-1 ring-border sm:px-12 lg:px-16 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Founding-partner pricing
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          Free during MVP. 70% off the first year for the first 10 paying
          rentals.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700">
          €90 for the entire first year (~€7.50/month) with a money-back
          guarantee. After that, simple monthly pricing — no per-vehicle fees,
          no commission on bookings.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="mailto:info@carrentdesk.com"
            className="inline-flex items-center justify-center rounded-full bg-brand-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            Talk to us
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-surface-soft"
          >
            See the marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}
