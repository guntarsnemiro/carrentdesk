import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/app/for-rentals/_components/faq";
import { SignupCTAButton } from "./_components/signup-modal";

/* ── SEO metadata ───────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Get More Bookings for Your Car Rental — CarRentDesk",
  description:
    "Thousands of travellers search for car rentals in your city every month. List your fleet on CarRentDesk and get found — no commission, no subscription.",
  keywords: [
    "get more car rental bookings",
    "car rental listing platform",
    "independent car rental company",
    "car rental marketplace",
    "car rental booking software",
    "local car rental online presence",
    "car rental management software",
    "fleet management for rental companies",
    "car rental CRM",
    "car rental invoicing software",
    "independent car rental software",
    "0% commission car rental platform",
  ],
  alternates: { canonical: "https://carrentdesk.com/join" },
  openGraph: {
    title: "Get More Bookings for Your Car Rental — CarRentDesk",
    description:
      "Thousands of travellers search for car rentals in your city every month. List your fleet on CarRentDesk and get found — no commission, no subscription.",
    url: "https://carrentdesk.com/join",
    siteName: "CarRentDesk",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "CarRentDesk — Get More Car Rental Bookings", type: "image/png" }],
  },
};

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CarRentDesk",
  url: "https://carrentdesk.com",
  description:
    "CarRentDesk helps independent car rental companies get found online and receive direct bookings — no commission, no subscription.",
};

const HOW_IT_WORKS = [
  {
    num: "1",
    title: "List your fleet",
    body: "Add your cars, your location, and your prices. Takes about 5 minutes.",
    note: null,
  },
  {
    num: "2",
    title: "Customers find you",
    body: "Travellers searching for a car rental in your city see your fleet and pick a vehicle.",
    note: null,
  },
  {
    num: "3",
    title: "Booking is confirmed",
    body: "The customer pays a small confirmation fee by card. You get notified instantly and confirm or decline.",
    note: "If you can't take it, the fee is returned to the customer.",
  },
  {
    num: "4",
    title: "They show up. You hand over the keys.",
    body: "The full rental is paid to you at pickup. CarRentDesk takes nothing from that. The customer is yours to keep.",
    note: null,
  },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function JoinPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="min-h-screen bg-white">

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-brand-950">CarRentDesk</Link>
          <div className="flex items-center gap-4">
            <Link href="/platform" className="hidden text-sm text-neutral-500 hover:text-neutral-900 sm:block">Platform</Link>
            <Link href="#faq" className="hidden text-sm text-neutral-500 hover:text-neutral-900 sm:block">FAQ</Link>
            <Link href="/app/login" className="text-sm font-medium text-brand-700 hover:underline">Sign in →</Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="mx-auto w-full max-w-4xl px-6 py-20 text-center lg:px-8 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            For independent car rental companies
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.08] tracking-tight text-brand-950 sm:text-6xl">
            Get found.{" "}
            <span className="text-brand-600">Get booked.</span>
          </h1>
          <p className="mt-6 mx-auto max-w-xl text-lg leading-7 text-neutral-600">
            Thousands of people search for a car rental in your city every month.
            CarRentDesk puts your fleet in front of them — and sends the booking straight to you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {["List in 5 minutes", "No commission", "No subscription", "The customer is yours"].map((t) => (
              <span key={t} className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-medium text-neutral-600">{t}</span>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <SignupCTAButton />
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="bg-surface-soft py-16 lg:py-20">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Simple by design</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">How it works</h2>
              <p className="mt-4 mx-auto max-w-xl text-base text-neutral-600">
                From listing your first car to receiving your first booking — here is the full picture.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.num} className="relative rounded-2xl border border-border bg-white p-6">
                  <div className="flex size-9 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                    {step.num}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-brand-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{step.body}</p>
                  {step.note && (
                    <p className="mt-3 text-xs italic text-neutral-400">{step.note}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <SignupCTAButton />
            </div>
          </div>
        </section>

        {/* ── Platform teaser ── */}
        <section className="py-14 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <p className="text-base text-neutral-600">
              Plus full fleet management, booking calendar, customer CRM, invoicing, and real P&L — all included.{" "}
              <Link href="/platform" className="font-medium text-brand-700 hover:underline">
                See everything the platform does →
              </Link>
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="border-t border-border bg-white py-16 lg:py-20">
          <div className="mx-auto w-full max-w-4xl px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Frequently asked</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
              Questions every rental owner asks first.
            </h2>
            <div className="mt-8"><FAQ /></div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="border-t border-border py-16 lg:py-20">
          <div className="mx-auto w-full max-w-lg px-6 text-center lg:px-8">
            <h2 className="text-2xl font-bold text-brand-950 sm:text-3xl">Ready to get more bookings?</h2>
            <p className="mt-3 text-sm text-neutral-500">Free to start. No card required.</p>
            <div className="mt-8 flex justify-center">
              <SignupCTAButton />
            </div>
            <p className="mt-5 text-xs text-neutral-400">
              Questions?{" "}
              <a href="mailto:info@carrentdesk.com" className="text-brand-700 hover:underline">info@carrentdesk.com</a>
              {" "}· Same-day reply.
            </p>
          </div>
        </section>

        <footer className="border-t border-border px-6 py-6 text-center">
          <p className="text-xs text-neutral-400">
            © 2026 CarRentDesk ·{" "}
            <Link href="/" className="hover:underline">Marketplace</Link>
            {" "}·{" "}
            <Link href="/platform" className="hover:underline">Platform</Link>
            {" "}·{" "}
            <Link href="/app/login" className="hover:underline">Sign in</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
