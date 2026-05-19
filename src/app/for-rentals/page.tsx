import type { Metadata } from "next";
import Link from "next/link";
import { DemoForm } from "@/app/for-rentals/_components/demo-form";
import { ModuleGrid } from "@/app/for-rentals/_components/module-grid";
import { FAQ } from "@/app/for-rentals/_components/faq";

export const metadata: Metadata = {
  title: "For rental owners — The operations platform for independent rentals",
  description:
    "Everything your car rental business needs in one place. Fleet management, inspections, customer records, and daily workflows — built by rental owners, for rental owners.",
};

export default function ForRentalsPage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ProblemBlock />
      <BuiltFor />
      <ModulesSection />
      <DualValueBlock />
      <FounderNote />
      <FoundingOffer />
      <Onboarding />
      <FAQSection />
      <FinalCTA />
    </>
  );
}

/* ---------------------------------------------------------------------------
 * 1. Hero
 * ------------------------------------------------------------------------- */
function Hero() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-4 lg:px-8 lg:pt-6">
      <div className="relative isolate overflow-hidden rounded-2xl bg-brand-950 sm:rounded-3xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 0%, rgba(93,138,202,0.20) 0%, rgba(15,42,82,0) 70%)",
          }}
        />

        <div className="grid gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:px-14 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
              For independent rental companies
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
              Everything your car
              <br className="hidden sm:block" /> rental business needs
              <br className="hidden sm:block" /> in one place.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-100 sm:text-lg">
              Fleet management, inspections, customer records, and daily
              workflows — simplified. Built by rental owners, for rental owners.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/join"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
              >
                Start free trial →
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-full border border-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
              >
                Book a demo
              </Link>
            </div>

            <p className="mt-5 text-xs text-brand-200">
              Free during beta — no credit card, no contract, 30-second setup.
            </p>
          </div>

          <WhatsInsideCard />
        </div>
      </div>
    </section>
  );
}

function WhatsInsideCard() {
  const items: Array<{ label: string; live: boolean }> = [
    { label: "Fleet & car management", live: true },
    { label: "Bookings & availability calendar", live: true },
    { label: "Customer database & risk tracking", live: true },
    { label: "Dashboard — today's pickups & returns", live: true },
    { label: "Revenue & finance overview", live: true },
    { label: "Excel import for cars & customers", live: true },
    { label: "Marketplace listing — 0% commission", live: true },
  ];

  return (
    <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/15 backdrop-blur sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">
        What&apos;s live today
      </p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm text-brand-100">
            <span aria-hidden className="grid size-5 place-items-center rounded-full bg-success/20 text-[10px] text-success">
              ✓
            </span>
            {item.label}
          </li>
        ))}
      </ul>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-200">
          Free during beta · No credit card · 30-second setup
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 2. Trust bar
 * ------------------------------------------------------------------------- */
function TrustBar() {
  const items = [
    "Baltic-built",
    "Founder-owned rental",
    "GDPR · EU-hosted data",
    "Free during beta",
    "0% commission",
    "30-second setup",
  ];
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-2 rounded-xl bg-surface-soft px-6 py-3 ring-1 ring-border">
        {items.map((label) => (
          <span
            key={label}
            className="text-xs font-medium uppercase tracking-wider text-neutral-700"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * 3. Problem block
 * ------------------------------------------------------------------------- */
function ProblemBlock() {
  const problems = [
    {
      title: "Big chains own the customers",
      body: "Sixt, Hertz, Avis, Booking — they have the airport contracts, the Google Ads budget, and the brand recognition. New independent rentals struggle to be found, regardless of how good the service is.",
    },
    {
      title: "Owner energy doesn't scale",
      body: "Year one, you handle every booking yourself. By year five, you're still answering WhatsApp at 11pm. Without proper tools, the business runs on personal capacity — and personal capacity has a ceiling.",
    },
    {
      title: "Your tools don't talk to each other",
      body: "Bookings in Excel. Customer documents in your phone gallery. Insurance papers in a drawer. Photos in a WhatsApp thread. Every audit, staff change, or busy weekend exposes how fragile the stack actually is.",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        The three failures
      </p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
        What quietly breaks independent rentals — every year, in every city.
      </h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
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

/* ---------------------------------------------------------------------------
 * 4. Built for how rentals actually run
 * ------------------------------------------------------------------------- */
function BuiltFor() {
  const items = [
    {
      title: "Run the business, not the operations",
      body: "Inspections, fleet records, bookings, customer history — all in one place. Less daily firefighting. More time deciding where the business goes next.",
    },
    {
      title: "Get found, get booked",
      body: "A free listing on the CarRentDesk marketplace puts you in front of local customers across the Baltics. Direct phone, WhatsApp, and email — no commission, no booking middleman.",
    },
    {
      title: "Built like a real business",
      body: "Audit trails on every action. EU-hosted, GDPR-compliant data. Per-vehicle revenue and utilization. Records that survive insurance audits and staff changes.",
    },
  ];

  return (
    <section className="bg-surface-soft py-14 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Built for how rentals actually run
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Less time on the daily grind. More time on the business that pays
            for it.
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-700">
            CarRentDesk is one platform that covers the daily operations of an
            independent rental — and the customer pipeline that keeps it busy.
            One login. One source of truth. No spreadsheets.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-background p-6 ring-1 ring-border"
            >
              <h3 className="text-lg font-semibold text-brand-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * 5. Modules
 * ------------------------------------------------------------------------- */
function ModulesSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Everything you need — live today
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          One platform. All the tools independent rentals actually use.
        </h2>
        <p className="mt-4 text-base leading-7 text-neutral-700">
          Fleet records, booking calendar, customer database, daily dashboard, revenue overview —
          all built and live. Sign up in 30 seconds and start using it today.
          No demo call required.
        </p>
      </div>

      <div className="mt-10">
        <ModuleGrid />
      </div>

      <p className="mt-8 max-w-3xl text-sm leading-6 text-neutral-600">
        Built with and tested by real rental companies in Riga. Every feature
        comes from an actual operator problem — not a product manager's guess.
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * 6. Two halves of one platform
 * ------------------------------------------------------------------------- */
function DualValueBlock() {
  return (
    <section
      id="claim"
      className="mx-auto w-full max-w-7xl px-6 pb-14 lg:px-8 lg:pb-20"
    >
      <div className="grid gap-6 rounded-3xl bg-brand-50 p-8 ring-1 ring-brand-100 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Two halves of one platform
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
            Operations on one side. A marketplace listing on the other.
          </h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-neutral-700">
            Customers searching for local rentals across the Baltics find you
            directly on CarRentDesk.com. No commission, no markup, no booking
            middleman. Operators using the platform actively earn a public
            verified badge that small chains can&apos;t match.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/join"
              className="inline-flex items-center justify-center rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
            >
              Start free trial →
            </Link>
            <Link
              href="/riga"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-brand-900 transition-colors hover:bg-surface-soft"
            >
              See the Riga marketplace
            </Link>
          </div>
        </div>

        <ul className="space-y-3 rounded-2xl bg-background p-6 text-sm ring-1 ring-border">
          <BonusRow text="Discoverable to local customers across all three Baltic capitals" />
          <BonusRow text="Direct contact — phone, WhatsApp, email — never blocked behind a checkout" />
          <BonusRow text="Verified badge once you actively use the operations platform" />
          <BonusRow text="Anonymous click analytics on how many customers contacted you" />
        </ul>
      </div>
    </section>
  );
}

function BonusRow({ text }: { text: string }) {
  return (
    <li className="flex gap-2.5 text-neutral-700">
      <span
        aria-hidden
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success"
      >
        ✓
      </span>
      <span className="leading-6">{text}</span>
    </li>
  );
}

/* ---------------------------------------------------------------------------
 * 7. Founder note
 * ------------------------------------------------------------------------- */
function FounderNote() {
  return (
    <section className="bg-surface-soft py-14 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div className="mx-auto w-full max-w-sm lg:mx-0">
            <FounderPhotoPlaceholder />
            <p className="mt-4 text-sm font-semibold text-brand-950">
              Guntars Nemiro
            </p>
            <p className="text-xs text-neutral-500">
              Founder, CarRentDesk · Owner, Baltic Car Rent (Riga)
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Why this exists
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
              I built this for my own rental. Now you can use it too.
            </h2>
            <div className="mt-5 space-y-4 text-base leading-7 text-neutral-700">
              <p>
                I&apos;ve owned and operated Baltic Car Rent in Riga for fifteen
                years. I know what it&apos;s like to watch booking platforms
                take a cut of revenue and customer relationships I built
                myself. I know what it&apos;s like to spend more weekends in
                the office than I care to count, holding the business together
                with WhatsApp messages and Excel sheets.
              </p>
              <p>
                CarRentDesk is the platform I needed and never had. The
                everyday operations tool we use to run our own rental. The
                customer pipeline we never built. The business layer the big
                chains keep to themselves.
              </p>
              <p className="font-medium text-brand-950">
                If you run an independent rental, this is built for you — by
                someone who runs one too.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FounderPhotoPlaceholder() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-brand-900 ring-1 ring-brand-800">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.12) 0%, rgba(15,42,82,0) 70%), linear-gradient(135deg, #0f2a52 0%, #1d3771 100%)",
        }}
      />
      <div className="relative grid h-full w-full place-items-center text-white">
        <div className="text-center">
          <span className="grid size-24 place-items-center rounded-full bg-white/10 text-3xl font-bold ring-1 ring-white/20">
            GN
          </span>
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-brand-200">
            Photo coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * 8. Founding-partner offer
 * ------------------------------------------------------------------------- */
function FoundingOffer() {
  const benefits = [
    "Free during beta — no credit card, no contract, cancel anytime",
    "Early-adopter pricing locked in forever once billing goes live",
    "All modules included — fleet, bookings, customers, calendar, finance",
    "Excel import — bring your existing cars and customer list in minutes",
    "Marketplace listing included — 0% commission, direct customer contact",
    "Direct line to the founder — your feedback shapes what ships next",
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
      <div className="overflow-hidden rounded-3xl bg-brand-950 px-6 py-12 text-white sm:px-10 lg:px-16 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-500">
              Early adopter offer
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Get on now while it&apos;s free.
              Lock in the best price forever.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-brand-100">
              The platform is free during beta. When pricing goes live,
              early adopters keep a permanently lower rate. Sign up takes
              30 seconds — no demo call, no sales process, no waiting.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/join"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
              >
                Start free trial →
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-full border border-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
              >
                Book a demo first
              </Link>
            </div>
          </div>

          <ul className="space-y-3 rounded-2xl bg-brand-900/60 p-6 ring-1 ring-brand-800">
            {benefits.map((b) => (
              <li
                key={b}
                className="flex gap-2.5 text-sm leading-6 text-brand-100"
              >
                <span
                  aria-hidden
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-500/20 text-accent-500"
                >
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * 9. Onboarding
 * ------------------------------------------------------------------------- */
function Onboarding() {
  const steps = [
    {
      title: "Sign up in 30 seconds",
      body: "Enter your company name and email at carrentdesk.com/join. You get a magic link — click it and you're in your dashboard instantly. No sales call, no waiting.",
    },
    {
      title: "Import your fleet and customers",
      body: "Upload your existing cars and customers from an Excel file. Our template makes it straightforward — most companies are fully set up in under an hour.",
    },
    {
      title: "Run your rental from day one",
      body: "Add bookings, check the availability calendar, track inspection dates, see your revenue. Everything is ready to use the moment you log in.",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-14 lg:px-8 lg:pb-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Onboarding
      </p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
        From sign-up to fully running in under an hour.
      </h2>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl bg-surface-soft p-6 ring-1 ring-border"
          >
            <span className="grid size-9 place-items-center rounded-full bg-brand-900 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-brand-950">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-neutral-700">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * 10. FAQ
 * ------------------------------------------------------------------------- */
function FAQSection() {
  return (
    <section className="bg-surface-soft py-14 lg:py-20">
      <div className="mx-auto w-full max-w-4xl px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Frequently asked
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          The questions every rental owner asks us first.
        </h2>
        <div className="mt-8">
          <FAQ />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * 11. Final CTA + form
 * ------------------------------------------------------------------------- */
function FinalCTA() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Ready when you are
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Start free in 30 seconds — or book a demo if you prefer.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-neutral-700">
            You can sign up and explore the full platform right now at{" "}
            <Link href="/join" className="font-medium text-brand-700 hover:underline">carrentdesk.com/join</Link>.
            Or if you&apos;d rather see it live with someone walking you through —
            fill in the form and we&apos;ll reply the same day.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-neutral-700">
            <li>
              <span className="font-medium text-brand-950">Email:</span>{" "}
              <a
                href="mailto:info@carrentdesk.com"
                className="text-brand-700 hover:underline"
              >
                info@carrentdesk.com
              </a>
            </li>
            <li>
              <span className="font-medium text-brand-950">Cities served:</span>{" "}
              Riga · Tallinn · Vilnius (more on request)
            </li>
            <li>
              <span className="font-medium text-brand-950">Response time:</span>{" "}
              Same business day
            </li>
          </ul>
        </div>

        <DemoForm id="demo" />
      </div>
    </section>
  );
}
