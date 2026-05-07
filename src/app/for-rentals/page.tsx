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
                href="#demo"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
              >
                Book a 30-min demo
              </Link>
              <Link
                href="#claim"
                className="inline-flex items-center justify-center rounded-full border border-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
              >
                Claim your listing
              </Link>
            </div>

            <p className="mt-5 text-xs text-brand-200">
              Founding-partner spots are limited — design partners come first.
            </p>
          </div>

          <WhatsInsideCard />
        </div>
      </div>
    </section>
  );
}

function WhatsInsideCard() {
  const items: Array<{ label: string; tag: string; live?: boolean }> = [
    { label: "Pickup & return inspections", tag: "Live", live: true },
    { label: "Fleet & utilization", tag: "Q3 2026" },
    { label: "Bookings & pricing", tag: "Q4 2026" },
    { label: "Customer & document records", tag: "Q1 2027" },
    { label: "Workflow automation", tag: "Q2 2027" },
    { label: "Financial dashboards", tag: "Q2 2027" },
  ];

  return (
    <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/15 backdrop-blur sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">
        What&apos;s inside
      </p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm text-brand-100"
          >
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden
                className={`grid size-5 place-items-center rounded-full text-[10px] ${
                  item.live
                    ? "bg-success/20 text-success"
                    : "bg-white/10 text-brand-200"
                }`}
              >
                ✓
              </span>
              {item.label}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                item.live ? "text-success" : "text-brand-200/80"
              }`}
            >
              {item.tag}
            </span>
          </li>
        ))}
        <li className="flex items-center gap-2.5 pt-1 text-sm text-brand-100">
          <span
            aria-hidden
            className="grid size-5 place-items-center rounded-full bg-accent-500/20 text-[10px] text-accent-500"
          >
            +
          </span>
          Free marketplace listing
        </li>
      </ul>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-200">
          9 modules · 1 platform · 0% commission
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
    "GDPR · EU-only data",
    "Free during MVP",
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
          The full operations OS
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          Nine modules. One platform. Built in the order rentals actually need.
        </h2>
        <p className="mt-4 text-base leading-7 text-neutral-700">
          Inspections are live today. Every other module ships in a known
          quarter on the public roadmap. Design partners get the new modules
          months before the rest of the platform — and shape what they look
          like along the way.
        </p>
      </div>

      <div className="mt-10">
        <ModuleGrid />
      </div>

      <p className="mt-8 max-w-3xl text-sm leading-6 text-neutral-600">
        Modules ship sequentially, not all at once. That&apos;s deliberate — we
        build with three rental companies in Riga, fix what breaks under real
        operator load, then roll out to the rest of the platform.
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
              href="/riga"
              className="inline-flex items-center justify-center rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
            >
              See the Riga marketplace →
            </Link>
            <a
              href="mailto:info@carrentdesk.com?subject=Claim my CarRentDesk listing"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-brand-900 transition-colors hover:bg-surface-soft"
            >
              Already on CarRentDesk? Claim your listing
            </a>
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
    "Free for the entirety of MVP — no card, no contract, no fine print",
    "Founding-partner pricing locked forever — even after public prices rise",
    "Money-back guarantee: if it doesn't pay for itself, you get a full refund",
    "Direct line to the founder — weekly 30-min check-ins for product feedback",
    "First access to every new module before it ships to the public platform",
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
      <div className="overflow-hidden rounded-3xl bg-brand-950 px-6 py-12 text-white sm:px-10 lg:px-16 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-500">
              Founding-partner program
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              The first ten rentals to commit get the best deal we&apos;ll ever
              offer.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-brand-100">
              We&apos;re not building this in a vacuum — we&apos;re building it
              with you. Concrete pricing, contract terms, and onboarding
              timeline are walked through in the demo, tailored to your fleet
              size and city.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
              >
                Book a demo
              </Link>
              <a
                href="mailto:info@carrentdesk.com"
                className="inline-flex items-center justify-center rounded-full border border-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
              >
                Email us directly
              </a>
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
      title: "30-min demo",
      body: "Book a call. We walk through the product together and answer every question — pricing, data, timing, fit.",
    },
    {
      title: "Setup, one day",
      body: "We add your fleet, import your existing records where possible, and configure the workflows for how your rental actually runs.",
    },
    {
      title: "First week running",
      body: "We sit with your team during the first real pickups, returns, and customer flows. After the first week, you fly solo.",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-14 lg:px-8 lg:pb-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Onboarding
      </p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
        From first call to running on the platform in under a week.
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
            Book a 30-min demo. No prep needed.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-neutral-700">
            Tell us about your rental — fleet size, biggest pain point, what
            you&apos;d want fixed first. We&apos;ll reply within 24 hours to
            schedule the walkthrough.
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
