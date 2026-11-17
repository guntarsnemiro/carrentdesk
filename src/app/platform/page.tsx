import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/app/for-rentals/_components/faq";

/* ── SEO metadata ───────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Platform — Fleet Management, Bookings, CRM & Invoicing | CarRentDesk",
  description:
    "Everything an independent car rental needs in one platform. Fleet management, booking calendar, customer CRM, PDF invoicing, real P&L reporting, and a marketplace listing — all included.",
  alternates: { canonical: "https://carrentdesk.com/platform" },
  openGraph: {
    title: "Platform — CarRentDesk",
    description:
      "Fleet management, booking calendar, CRM, invoicing, and P&L reporting for independent car rental companies.",
    url: "https://carrentdesk.com/platform",
    siteName: "CarRentDesk",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "CarRentDesk Platform", type: "image/png" }],
  },
};

const INCLUDED = [
  "Booking calendar & fleet management",
  "Customer CRM with blacklist protection",
  "PDF invoicing with email send",
  "Real P&L — revenue, costs, depreciation",
  "Marketplace listing — 0% commission",
  "Add each car from the office",
  "Unlimited team members",
  "Export your data anytime",
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-bold text-brand-950">CarRentDesk</Link>
        <div className="flex items-center gap-4">
          <Link href="/join" className="hidden text-sm text-neutral-500 hover:text-neutral-900 sm:block">Get started</Link>
          <Link href="/app/login" className="text-sm font-medium text-brand-700 hover:underline">Sign in →</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto w-full max-w-4xl px-6 py-20 text-center lg:px-8 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Everything in one platform
        </p>
        <h1 className="mt-4 text-5xl font-bold leading-[1.08] tracking-tight text-brand-950 sm:text-6xl">
          Built for independent<br className="hidden sm:block" /> car rental operators.
        </h1>
        <p className="mt-6 mx-auto max-w-xl text-lg leading-7 text-neutral-600">
          Fleet management, bookings, customer CRM, invoicing, and real profit numbers —
          all in one place. Built by a rental owner who needed it and couldn&apos;t find it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {["EU-hosted · GDPR", "Founder-built", "No lock-in", "Cancel anytime"].map((t) => (
            <span key={t} className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-medium text-neutral-600">{t}</span>
          ))}
        </div>
        <div className="mt-10">
          <Link
            href="/join"
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
          >
            Add your fleet — it&apos;s free →
          </Link>
        </div>
      </section>

      {/* ── Included list ── */}
      <section className="border-y border-border bg-surface-soft py-12">
        <div className="mx-auto w-full max-w-4xl px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-8">
            Everything your rental needs — included
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURE SHOWCASE SECTIONS
      ══════════════════════════════════════════════════════════════ */}

      {/* ── 1. Booking calendar ── */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <FeatureLabel>Booking & availability calendar</FeatureLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                Every car. Every day.<br />At a glance.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                Visual Gantt calendar shows all your vehicles and their bookings in one view.
                Create, move, and extend rentals without touching a spreadsheet.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Spot conflicts and gaps instantly",
                  "Short-term and long-term rentals side by side",
                  "Click any slot to create or edit a booking",
                  "Today view shows pick-ups and returns at a glance",
                ].map((b) => <Bullet key={b}>{b}</Bullet>)}
              </ul>
            </div>
            <CalendarMockup />
          </div>
        </div>
      </section>

      {/* ── 2. Fleet management ── */}
      <section className="bg-surface-soft py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <FleetMockup />
            <div>
              <FeatureLabel>Fleet management software</FeatureLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                Every car. Every detail.<br />Nothing missed.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                Full vehicle records with inspection dates, insurance expiry, odometer readings,
                and maintenance history. Reminders before anything lapses.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Insurance and inspection expiry alerts",
                  "Odometer and fuel type tracking",
                  "Per-vehicle revenue and utilisation",
                  "Maintenance log with cost history",
                ].map((b) => <Bullet key={b}>{b}</Bullet>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Customer CRM ── */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <FeatureLabel>Car rental CRM</FeatureLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                Know your customers.<br />Protect your business.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                Full customer database with rental history, document numbers, and risk flags.
                The global blacklist network alerts you to problem customers reported by other rental companies.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Driver licence, ID, passport stored securely",
                  "Rental history for every customer",
                  "Global blacklist — alerts from other operators",
                  "Blacklist flag visible on every new booking",
                ].map((b) => <Bullet key={b}>{b}</Bullet>)}
              </ul>
            </div>
            <CustomerMockup />
          </div>
        </div>
      </section>

      {/* ── 4. Invoicing ── */}
      <section className="bg-surface-soft py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <InvoiceMockup />
            <div>
              <FeatureLabel>Rental invoicing software</FeatureLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                Professional invoices.<br />One click.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                Generate a PDF invoice from any booking in one click.
                Edit any field before sending — line items, VAT rate, invoice number.
                Email it directly from the platform and track the status.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "PDF generated from booking data automatically",
                  "Fully editable before sending",
                  "Email direct from the platform",
                  "Track draft / sent / paid status",
                ].map((b) => <Bullet key={b}>{b}</Bullet>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Revenue & P&L ── */}
      <section className="bg-brand-950 py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <FeatureLabel light>Revenue & P&L reporting</FeatureLabel>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                Real profit numbers.<br />Not just bookings.
              </h2>
              <p className="mt-4 text-base leading-7 text-brand-200">
                Pro-rata daily revenue, amortised insurance, maintenance costs, and per-vehicle
                depreciation. The monthly net profit number your accountant would recognise — built in, no spreadsheet needed.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Pro-rata revenue — counted by the day, not the invoice",
                  "Insurance and fees amortised across the year",
                  "Straight-line vehicle depreciation auto-calculated",
                  "Per-car profitability — see which vehicles pay off",
                ].map((b) => <Bullet key={b} light>{b}</Bullet>)}
              </ul>
            </div>
            <RevenueMockup />
          </div>
        </div>
      </section>

      {/* ── 6. Marketplace ── */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <MarketplaceMockup />
            <div>
              <FeatureLabel>Marketplace listing — 0% commission</FeatureLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
                Get found.<br />Keep every euro.
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                Your company is listed on CarRentDesk.com — customers searching for car rentals in
                your city find you directly. They call, WhatsApp, or email you.
                No booking middleman. No commission. Ever.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Listed in your city from day one",
                  "Direct phone, WhatsApp, email contact",
                  "0% commission — no cut of your revenue",
                  "Verified badge for active platform users",
                ].map((b) => <Bullet key={b}>{b}</Bullet>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder quote ── */}
      <section className="border-t border-border bg-surface-soft py-14">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="text-base leading-7 text-neutral-700">
            <span className="font-semibold text-neutral-900">&ldquo;Built by a rental owner.</span>{" "}
            I&apos;ve run Baltic Car Rent in Riga for 15 years. CarRentDesk is the platform I needed and never had —
            built for independent operators across Europe.&rdquo;
          </p>
          <p className="mt-3 text-sm text-neutral-400">— Guntars Nemiro, Founder</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border bg-white py-16 lg:py-20">
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
        <div className="mx-auto w-full max-w-lg px-6 text-center">
          <h2 className="text-2xl font-bold text-brand-950 sm:text-3xl">Ready to get more bookings?</h2>
          <p className="mt-3 text-sm text-neutral-500">Free to start. No card required.</p>
          <div className="mt-8">
            <Link
              href="/join"
              className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
            >
              Add your fleet — it&apos;s free →
            </Link>
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
          <Link href="/join" className="hover:underline">Get started</Link>
          {" "}·{" "}
          <Link href="/app/login" className="hover:underline">Sign in</Link>
        </p>
      </footer>
    </div>
  );
}

/* ── Shared small components ─────────────────────────────────────────── */

function FeatureLabel({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${light ? "text-brand-300" : "text-brand-700"}`}>
      {children}
    </p>
  );
}

function Bullet({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm leading-6 ${light ? "text-brand-200" : "text-neutral-700"}`}>
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${light ? "bg-white/10 text-white" : "bg-brand-100 text-brand-700"}`}>✓</span>
      {children}
    </li>
  );
}

/* ── UI Mockups ──────────────────────────────────────────────────────── */

function CalendarMockup() {
  const CARS = ["Toyota Corolla", "VW Passat", "Ford Focus", "Skoda Octavia", "BMW 3 Series"];
  const BOOKINGS = [
    { car: 0, start: 1, len: 4, name: "M. Bērziņš",   color: "bg-brand-500" },
    { car: 0, start: 7, len: 6, name: "J. Kalniņš",   color: "bg-brand-500" },
    { car: 1, start: 0, len: 3, name: "A. Liepiņš",   color: "bg-violet-500" },
    { car: 1, start: 5, len: 8, name: "K. Ozols",     color: "bg-violet-500" },
    { car: 2, start: 2, len: 5, name: "R. Zariņš",    color: "bg-emerald-500" },
    { car: 3, start: 0, len: 7, name: "I. Jansons",   color: "bg-amber-500" },
    { car: 3, start: 9, len: 4, name: "D. Krūmiņš",  color: "bg-amber-500" },
    { car: 4, start: 3, len: 9, name: "P. Vītoliņš", color: "bg-rose-500" },
  ];
  const DAYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
  const TOTAL = 13;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-border bg-slate-50 px-4 py-3">
        <span className="text-xs font-semibold text-neutral-700">June 2026</span>
        <div className="flex gap-1.5">
          <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">Today: 3 pick-ups</span>
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">2 returns</span>
        </div>
      </div>
      <div className="grid border-b border-border" style={{ gridTemplateColumns: `120px repeat(${TOTAL}, 1fr)` }}>
        <div className="px-3 py-2 text-[10px] font-medium text-neutral-400">Vehicle</div>
        {DAYS.map((d) => (
          <div key={d} className={`py-2 text-center text-[10px] font-medium ${d === "6" ? "text-brand-600 font-bold" : "text-neutral-400"}`}>{d}</div>
        ))}
      </div>
      {CARS.map((car, ci) => (
        <div key={car} className="relative grid border-b border-border last:border-0" style={{ gridTemplateColumns: `120px repeat(${TOTAL}, 1fr)`, minHeight: 36 }}>
          <div className="flex items-center px-3 py-2">
            <span className="truncate text-[11px] font-medium text-neutral-700">{car}</span>
          </div>
          {DAYS.map((d) => (
            <div key={d} className={`border-l border-border/50 ${d === "6" ? "bg-brand-50/40" : ""}`} />
          ))}
          {BOOKINGS.filter(b => b.car === ci).map((b) => (
            <div
              key={b.name}
              className={`absolute top-1.5 flex items-center rounded px-1.5 text-[10px] font-medium text-white ${b.color}`}
              style={{
                left: `calc(120px + ${b.start / TOTAL * 100}% * (100% - 120px) / 100% + 2px)`,
                width: `calc(${b.len / TOTAL * 100}% * (100% - 120px) / 100% - 4px)`,
                height: 22,
              }}
            >
              <span className="truncate">{b.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FleetMockup() {
  const cars = [
    { make: "Toyota Corolla", plate: "LV-4521", year: 2021, status: "Available", statusCls: "bg-emerald-50 text-emerald-700", fuel: "Petrol", insp: "Nov 2026", inspOk: true },
    { make: "VW Passat",      plate: "LV-7834", year: 2020, status: "On rent",   statusCls: "bg-brand-50 text-brand-700",    fuel: "Diesel", insp: "Aug 2026", inspOk: true },
    { make: "Ford Focus",     plate: "LV-2210", year: 2019, status: "Available", statusCls: "bg-emerald-50 text-emerald-700", fuel: "Petrol", insp: "Jun 2026", inspOk: false },
    { make: "BMW 3 Series",   plate: "LV-9902", year: 2022, status: "On rent",   statusCls: "bg-brand-50 text-brand-700",    fuel: "Diesel", insp: "Mar 2027", inspOk: true },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <div className="border-b border-border bg-slate-50 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-700">Fleet · 4 vehicles</span>
        <span className="text-[10px] text-neutral-400">2 available · 2 on rent</span>
      </div>
      <div className="divide-y divide-border">
        {cars.map((c) => (
          <div key={c.plate} className="flex items-center gap-3 px-4 py-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-soft text-lg">🚗</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800 truncate">{c.make}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.statusCls}`}>{c.status}</span>
              </div>
              <div className="mt-0.5 flex gap-3 text-[11px] text-neutral-400">
                <span>{c.plate}</span><span>{c.year}</span><span>{c.fuel}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-medium ${c.inspOk ? "text-neutral-400" : "text-red-600 font-semibold"}`}>
                {c.inspOk ? "" : "⚠ "}Insp {c.insp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerMockup() {
  const customers = [
    { name: "Mārtiņš Bērziņš", initials: "MB", rentals: 7, flag: null,        tag: "Regular",     tagCls: "bg-brand-50 text-brand-700" },
    { name: "Anna Liepiņa",    initials: "AL", rentals: 2, flag: null,        tag: "New",         tagCls: "bg-neutral-100 text-neutral-600" },
    { name: "Igor Petrov",     initials: "IP", rentals: 1, flag: "⚠ Blacklist", tag: "Blacklisted", tagCls: "bg-red-50 text-red-700" },
    { name: "Katrīna Ozola",   initials: "KO", rentals: 4, flag: null,        tag: "Regular",     tagCls: "bg-brand-50 text-brand-700" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <div className="border-b border-border bg-slate-50 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-700">Customers · 4 shown</span>
        <span className="text-[10px] text-neutral-400">1 risk flag</span>
      </div>
      <div className="divide-y divide-border">
        {customers.map((c) => (
          <div key={c.name} className={`flex items-center gap-3 px-4 py-3 ${c.flag ? "bg-red-50/30" : ""}`}>
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {c.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800 truncate">{c.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.tagCls}`}>{c.tag}</span>
              </div>
              <span className="text-[11px] text-neutral-400">{c.rentals} rental{c.rentals !== 1 ? "s" : ""}</span>
            </div>
            {c.flag && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">{c.flag}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <div className="border-b border-border bg-slate-50 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-700">Invoice #INV-0042</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Paid</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-[11px]">
          <div>
            <p className="font-semibold text-neutral-500 uppercase tracking-wide mb-1">From</p>
            <p className="font-semibold text-neutral-800">Baltic Car Rent SIA</p>
            <p className="text-neutral-500">Rīga, Latvia</p>
            <p className="text-neutral-500">VAT LV40003XXXXX</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-500 uppercase tracking-wide mb-1">To</p>
            <p className="font-semibold text-neutral-800">Mārtiņš Bērziņš</p>
            <p className="text-neutral-500">Issued: 3 Jun 2026</p>
            <p className="text-neutral-500">Due: 3 Jun 2026</p>
          </div>
        </div>
        <div className="rounded-lg border border-border overflow-hidden text-[11px]">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-slate-50 px-3 py-2 font-medium text-neutral-500">
            <span>Description</span><span>Qty</span><span>Total</span>
          </div>
          {[
            ["Toyota Corolla rental · 5 days", "5", "€250.00"],
            ["Child seat", "1", "€15.00"],
            ["Full insurance", "1", "€25.00"],
          ].map(([d, q, t]) => (
            <div key={d} className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-border px-3 py-2 text-neutral-700">
              <span>{d}</span><span className="text-right">{q}</span><span className="text-right font-medium">{t}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-neutral-500"><span>Subtotal (excl. VAT)</span><span>€241.67</span></div>
          <div className="flex justify-between text-neutral-500"><span>VAT 21%</span><span>€50.75</span></div>
          <div className="flex justify-between border-t border-border pt-1 font-bold text-neutral-900"><span>Total</span><span>€290.00</span></div>
        </div>
      </div>
    </div>
  );
}

function RevenueMockup() {
  const months = [
    { m: "Jan", rev: 3100, cost: 1200, net: 1900 },
    { m: "Feb", rev: 2800, cost: 1100, net: 1700 },
    { m: "Mar", rev: 4280, cost: 1400, net: 2880 },
    { m: "Apr", rev: 5100, cost: 1540, net: 3560 },
    { m: "May", rev: 6340, cost: 1470, net: 4870 },
    { m: "Jun", rev: 5900, cost: 1380, net: 4520 },
  ];
  const maxRev = Math.max(...months.map(m => m.rev));

  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/[0.06] shadow-lg ring-1 ring-white/10">
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">Revenue & P&L · 2026</span>
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">↑ 36% vs last year</span>
      </div>
      <div className="p-5">
        <div className="flex items-end gap-2 h-28">
          {months.map((m) => (
            <div key={m.m} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: 96 }}>
                <div className="w-full rounded-t bg-white/20" style={{ height: `${(m.cost / maxRev) * 96}px` }} />
                <div className="w-full rounded-t bg-emerald-400" style={{ height: `${(m.net / maxRev) * 96}px` }} />
              </div>
              <span className="text-[10px] text-brand-400">{m.m}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-[10px]">
          <span className="flex items-center gap-1 text-emerald-300"><span className="size-2 rounded-sm bg-emerald-400 inline-block" />Net profit</span>
          <span className="flex items-center gap-1 text-brand-400"><span className="size-2 rounded-sm bg-white/20 inline-block" />Costs</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/[0.06] p-3">
          {[
            { label: "Revenue", val: "€27.5k" },
            { label: "Costs",   val: "€8.1k" },
            { label: "Net",     val: "€19.4k" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[10px] text-brand-400">{s.label}</p>
              <p className="text-sm font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketplaceMockup() {
  const listings = [
    { name: "Baltic Car Rent", rating: "4.8", reviews: 124, badge: true,  city: "Riga" },
    { name: "Riga Auto Rent",  rating: "4.6", reviews: 87,  badge: false, city: "Riga" },
    { name: "EcoRent Latvia",  rating: "4.9", reviews: 203, badge: true,  city: "Riga" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <div className="border-b border-border bg-slate-50 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-700">Car rentals in Riga</span>
        <span className="text-[10px] text-neutral-400">31 companies</span>
      </div>
      <div className="divide-y divide-border">
        {listings.map((l) => (
          <div key={l.name} className="flex items-center gap-3 px-4 py-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-base font-bold text-brand-700">
              {l.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800">{l.name}</span>
                {l.badge && (
                  <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold text-brand-700">✓ Verified</span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px]">
                <span className="text-amber-500">★ {l.rating}</span>
                <span className="text-neutral-400">({l.reviews} reviews) · {l.city}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <button className="rounded-lg bg-brand-700 px-3 py-1 text-[10px] font-semibold text-white">Call</button>
              <button className="rounded-lg border border-border px-3 py-1 text-[10px] font-medium text-neutral-700">WhatsApp</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
