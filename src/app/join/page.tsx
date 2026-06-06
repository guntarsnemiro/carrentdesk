import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./_components/join-form";
import { FAQ } from "@/app/for-rentals/_components/faq";

/* ── SEO metadata ───────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Car Rental Management Software — Free Trial | CarRentDesk",
  description:
    "Car rental management software for independent operators. Fleet management, booking calendar, customer CRM, invoicing, and real P&L — all in one platform. Free during beta. No credit card, 30-second setup.",
  keywords: [
    "car rental management software",
    "car rental software",
    "CRM system for car rental business",
    "car rental fleet management",
    "car rental booking software",
    "rental car management system",
    "car rental business software",
    "fleet management for rental companies",
    "car rental operations software",
    "independent car rental software",
    "car rental CRM",
    "car rental invoicing software",
  ],
  alternates: {
    canonical: "https://carrentdesk.com/join",
  },
  openGraph: {
    title: "Car Rental Management Software — Free Trial | CarRentDesk",
    description:
      "Fleet management, booking calendar, customer CRM, invoicing, and real P&L in one platform. Built for independent car rental companies. Free during beta.",
    url: "https://carrentdesk.com/join",
    siteName: "CarRentDesk",
    type: "website",
  },
};

/* ── Schema.org structured data ─────────────────────────────────────── */

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CarRentDesk",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Free during beta",
  },
  description:
    "Car rental management software for independent operators. Fleet management, booking calendar, customer CRM, invoicing, and real P&L — all in one platform.",
  url: "https://carrentdesk.com/join",
  featureList: [
    "Fleet management and inspection tracking",
    "Booking and availability calendar",
    "Customer CRM with blacklist protection",
    "PDF invoicing with email send",
    "Revenue and P&L reporting",
    "Marketplace listing with 0% commission",
  ],
};

/* ── Content ─────────────────────────────────────────────────────────── */

const MODULES = [
  {
    icon: "📅",
    title: "Booking & Availability Calendar",
    body: "Visual Gantt calendar — every car, every day. Create bookings in seconds, spot conflicts at a glance, manage short-term and long-term rentals in one view.",
  },
  {
    icon: "🚗",
    title: "Fleet Management Software",
    body: "Full vehicle records — fuel type, insurance dates, inspection history, odometer, purchase price. Set reminders so nothing falls through the cracks.",
  },
  {
    icon: "👥",
    title: "Car Rental CRM",
    body: "Store driver details, licence numbers, rental history and notes. Instant blacklist check on every booking — protect yourself and alert others in the network.",
  },
  {
    icon: "📄",
    title: "Rental Invoicing Software",
    body: "Generate professional invoices in one click. Edit any field before sending, email them directly from the platform, track paid and unpaid status.",
  },
  {
    icon: "📊",
    title: "Revenue & P&L Reporting",
    body: "Pro-rata daily revenue, expense tracking, amortised costs, per-vehicle depreciation. See real net profit — not just bookings counted.",
  },
  {
    icon: "🌍",
    title: "Marketplace Listing — 0% Commission",
    body: "Your company appears on CarRentDesk.com — customers in your city find you directly. Phone, WhatsApp, email contact. Zero commission, no middleman.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Sign up in 30 seconds",
    body: "Enter your company name and email. We send a magic link — click it and you're straight in your dashboard. No sales call, no waiting, no credit card.",
  },
  {
    n: "2",
    title: "Import your existing data",
    body: "Upload your cars and customers from an Excel file using our template. Most companies are fully set up in under an hour.",
  },
  {
    n: "3",
    title: "Run your rental from day one",
    body: "Add bookings, use the calendar, track maintenance, send invoices, see your revenue. Everything works the moment you log in.",
  },
];

const INCLUDED = [
  "All modules — fleet, bookings, customers, calendar, finance",
  "PDF invoicing with email send",
  "Marketplace listing in your city — 0% commission",
  "Excel import — cars & customers",
  "Global blacklist network access",
  "Early-adopter pricing locked in forever",
  "Direct line to the founder",
  "No booking middleman, no hidden fees",
];

const COMPARISON = [
  { feature: "Availability calendar",           crd: true,  excel: false,      other: "partial" },
  { feature: "Customer CRM & blacklist",         crd: true,  excel: false,      other: false     },
  { feature: "Maintenance reminders",            crd: true,  excel: false,      other: false     },
  { feature: "Expense tracking",                 crd: true,  excel: "manual",   other: false     },
  { feature: "Pro-rata revenue (accrual)",       crd: true,  excel: false,      other: false     },
  { feature: "Vehicle depreciation in P&L",     crd: true,  excel: false,      other: false     },
  { feature: "PDF invoicing",                    crd: true,  excel: false,      other: "partial" },
  { feature: "Marketplace listing included",     crd: true,  excel: false,      other: false     },
  { feature: "Monthly price",                    crd: "Free", excel: "Free",    other: "€150–400"},
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function JoinPage() {
  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="min-h-screen bg-white">
        {/* ── Header ── */}
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-brand-950">
            CarRentDesk
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#faq" className="hidden text-sm text-neutral-500 hover:text-neutral-900 sm:block">
              FAQ
            </Link>
            <Link href="/app/login" className="text-sm font-medium text-brand-700 hover:underline">
              Sign in →
            </Link>
          </div>
        </header>

        {/* ── Hero + form ── */}
        <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">

            {/* Left */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Free during beta · No credit card · 30-second setup
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.08] tracking-tight text-brand-950 sm:text-5xl">
                Car Rental Management
                <br className="hidden sm:block" /> Software for Independent
                <br className="hidden sm:block" /> Operators
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg">
                Fleet management, booking calendar, customer CRM, invoicing, and real P&L —
                all in one platform. Built by a rental owner, for rental owners. Free during beta.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {["EU-hosted · GDPR", "0% commission", "Cancel anytime", "Founder-built"].map((t) => (
                  <span key={t} className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-medium text-neutral-600">
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-border bg-surface-soft p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                  What&apos;s included — free
                </p>
                <ul className="space-y-2.5">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: form */}
            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold text-neutral-900">Start your free trial</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Set up in 30 seconds. No credit card needed.
                </p>
                <div className="mt-6">
                  <JoinForm />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-surface-soft p-5">
                <p className="text-sm leading-6 text-neutral-600">
                  <span className="font-semibold text-neutral-800">Built by a rental owner.</span>{" "}
                  I&apos;ve run Baltic Car Rent in Riga for 15 years. CarRentDesk is the platform I needed and never had —
                  built for independent operators across Europe.
                </p>
                <p className="mt-2 text-xs text-neutral-400">— Guntars Nemiro, Founder</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-surface-soft py-16 lg:py-20">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Everything you need — live today
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
              One car rental management platform. Every tool you actually use.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
              No demo call required. Sign up and start using it today —
              all modules included from day one, no upsells.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((m) => (
                <div key={m.title} className="rounded-2xl bg-white p-6 ring-1 ring-border">
                  <span className="text-2xl">{m.icon}</span>
                  <h3 className="mt-3 text-base font-semibold text-brand-950">{m.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Finance / P&L ── */}
        <section className="bg-brand-950 py-16 lg:py-20">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                  Real P&L — unique to CarRentDesk
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  The only car rental software that shows you real profit — not just bookings.
                </h2>
                <p className="mt-4 text-base leading-7 text-brand-200">
                  Pro-rata daily revenue, amortised insurance and government fees,
                  per-vehicle depreciation. The monthly P&L number your accountant would recognise.
                  No spreadsheet needed.
                </p>
                <Link
                  href="#signup"
                  className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
                >
                  Start free trial →
                </Link>
              </div>

              <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/15">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand-300">
                  Illustrative P&L · 10-car fleet
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-brand-400">
                      <th className="pb-2 pr-3 font-medium">Month</th>
                      <th className="pb-2 pr-3 text-right font-medium">Revenue</th>
                      <th className="pb-2 pr-3 text-right font-medium">Costs</th>
                      <th className="pb-2 text-right font-medium">Net profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-brand-100">
                    {[
                      ["Mar 2026", "€4,280", "−€1,400", "€2,880"],
                      ["Apr 2026", "€5,100", "−€1,540", "€3,560"],
                      ["May 2026", "€6,340", "−€1,470", "€4,870"],
                    ].map(([m, r, c, n]) => (
                      <tr key={m}>
                        <td className="py-2 pr-3 text-brand-300">{m}</td>
                        <td className="py-2 pr-3 text-right">{r}</td>
                        <td className="py-2 pr-3 text-right text-red-400">{c}</td>
                        <td className="py-2 text-right font-bold text-emerald-300">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-[11px] text-brand-500">
                  Costs = maintenance + amortised insurance + depreciation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Why not just use Excel?
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            CarRentDesk vs Excel vs other car rental software
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            Most independent rentals run on spreadsheets and WhatsApp. That works — until a car misses an
            inspection, a customer dispute has no paper trail, or you can&apos;t answer &ldquo;which car is actually profitable?&rdquo;
          </p>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-left text-xs">
                  <th className="px-5 py-3 font-medium text-neutral-500">Feature</th>
                  <th className="px-5 py-3 text-center font-semibold text-brand-700">CarRentDesk</th>
                  <th className="px-5 py-3 text-center font-medium text-neutral-500">Excel / Sheets</th>
                  <th className="px-5 py-3 text-center font-medium text-neutral-500">Other rental tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON.map((r) => (
                  <tr key={r.feature} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-neutral-700">{r.feature}</td>
                    <td className="px-5 py-3 text-center"><CompCell val={r.crd} /></td>
                    <td className="px-5 py-3 text-center"><CompCell val={r.excel} /></td>
                    <td className="px-5 py-3 text-center"><CompCell val={r.other} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            "Other rental tools" = typical fleet management SaaS. Pricing based on publicly listed rates, 2026.
          </p>
        </section>

        {/* ── How it works ── */}
        <section className="bg-surface-soft py-16 lg:py-20">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Getting started
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
              From sign-up to fully running in under an hour.
            </h2>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-2xl bg-white p-6 ring-1 ring-border">
                  <span className="grid size-9 place-items-center rounded-full bg-brand-900 text-sm font-semibold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-brand-950">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto w-full max-w-4xl px-6 py-16 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Frequently asked
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Questions every rental owner asks first.
          </h2>
          <div className="mt-8">
            <FAQ />
          </div>
        </section>

        {/* ── Bottom CTA + form ── */}
        <section id="signup" className="border-t border-border bg-surface-soft py-16 lg:py-20">
          <div className="mx-auto w-full max-w-lg px-6 text-center lg:px-8">
            <h2 className="text-2xl font-bold text-brand-950 sm:text-3xl">
              Ready to manage your rental like a pro?
            </h2>
            <p className="mt-3 text-sm text-neutral-500">
              Free during beta. No credit card. Takes 30 seconds.
            </p>
            <div className="mt-8 rounded-2xl border border-border bg-white p-7 shadow-sm text-left">
              <JoinForm />
            </div>
            <p className="mt-5 text-xs text-neutral-400">
              Questions?{" "}
              <a href="mailto:info@carrentdesk.com" className="text-brand-700 hover:underline">
                info@carrentdesk.com
              </a>
              {" "}· Same-day reply.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border px-6 py-6 text-center">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} CarRentDesk ·{" "}
            <Link href="/" className="hover:underline">Marketplace</Link>
            {" "}·{" "}
            <Link href="/app/login" className="hover:underline">Sign in</Link>
          </p>
        </footer>
      </div>
    </>
  );
}

function CompCell({ val }: { val: boolean | string }) {
  if (val === true)      return <span className="font-semibold text-emerald-600">✓ Yes</span>;
  if (val === false)     return <span className="text-neutral-300">—</span>;
  if (val === "partial") return <span className="text-xs text-amber-500">Partial</span>;
  if (val === "manual")  return <span className="text-xs text-amber-500">Manual</span>;
  return <span className="font-semibold text-neutral-700">{val}</span>;
}
