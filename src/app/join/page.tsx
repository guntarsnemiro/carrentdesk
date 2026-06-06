import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./_components/join-form";

export const metadata: Metadata = {
  title: "Start free trial · CarRentDesk",
  description:
    "Fleet management, bookings, customer records, invoicing, and marketplace listing — all in one platform. Free during beta. No credit card, 30-second setup.",
};

/* ─────────────────────────────────────────────────────────────────── */

const MODULES = [
  {
    icon: "📅",
    title: "Booking & availability calendar",
    body: "Visual Gantt calendar — every car, every day. Create bookings in seconds, spot conflicts at a glance, manage short-term and long-term rentals in one view.",
  },
  {
    icon: "🚗",
    title: "Fleet management",
    body: "Full vehicle records — fuel type, insurance dates, inspection history, odometer, purchase price. Set reminders so nothing falls through the cracks.",
  },
  {
    icon: "👥",
    title: "Customer database",
    body: "Store driver details, licence numbers, rental history and notes. Instant blacklist check on every booking — protect yourself and alert others in the network.",
  },
  {
    icon: "📄",
    title: "PDF invoicing",
    body: "Generate professional invoices in one click. Edit any field before sending, email them directly from the platform, and track paid / unpaid status.",
  },
  {
    icon: "📊",
    title: "Revenue & P&L",
    body: "Pro-rata daily revenue, expense tracking, amortised costs, per-vehicle depreciation. See real net profit — not just bookings counted.",
  },
  {
    icon: "🌍",
    title: "Marketplace listing included",
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
  "Marketplace listing in your city",
  "Excel import — cars & customers",
  "Global blacklist network access",
  "Early-adopter pricing locked in forever",
  "Direct line to the founder",
  "No commission, no booking middleman",
];

/* ─────────────────────────────────────────────────────────────────── */

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-bold text-brand-950">
          CarRentDesk
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/for-rentals" className="hidden text-sm text-neutral-500 hover:text-neutral-900 sm:block">
            Learn more
          </Link>
          <Link href="/app/login" className="text-sm font-medium text-brand-700 hover:underline">
            Sign in →
          </Link>
        </div>
      </header>

      {/* ── Hero + form ── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">

          {/* Left: pitch */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Free during beta · No credit card · 30-second setup
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.08] tracking-tight text-brand-950 sm:text-5xl">
              Run your car rental
              <br className="hidden sm:block" /> like a pro — for free.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg">
              One platform for fleet, bookings, customers, invoicing, and revenue.
              Built by a rental owner, for rental owners. Free during beta — with pricing locked in for early adopters.
            </p>

            {/* Trust signals */}
            <div className="mt-7 flex flex-wrap gap-3">
              {["EU-hosted · GDPR", "0% commission", "Founder-owned rental", "Cancel anytime"].map((t) => (
                <span key={t} className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-medium text-neutral-600">
                  {t}
                </span>
              ))}
            </div>

            {/* What's included checklist */}
            <div className="mt-10 rounded-2xl border border-border bg-surface-soft p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">What's included — free</p>
              <ul className="space-y-2.5">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">Create your account</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Set up in 30 seconds. No credit card needed.
              </p>
              <div className="mt-6">
                <JoinForm />
              </div>
            </div>

            {/* Founder note under the form */}
            <div className="mt-4 rounded-2xl border border-border bg-surface-soft p-5">
              <p className="text-sm leading-6 text-neutral-600">
                <span className="font-semibold text-neutral-800">Built by a rental owner.</span>{" "}
                I've run Baltic Car Rent in Riga for 15 years. CarRentDesk is the platform I needed and never had. If you run an independent rental — this is for you.
              </p>
              <p className="mt-2 text-xs text-neutral-400">— Guntars Nemiro, Founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="bg-surface-soft py-16 lg:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Everything you need — live today</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            One platform. Every tool your rental actually uses.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            No demo call required. Sign up and start using it today — all modules are included from day one.
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

      {/* ── Finance highlight ── */}
      <section className="bg-brand-950 py-16 lg:py-20">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">Finance intelligence</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                The first rental platform that shows you real profit — not just bookings.
              </h2>
              <p className="mt-4 text-base leading-7 text-brand-200">
                Pro-rata daily revenue, amortised insurance costs, per-vehicle depreciation.
                The monthly P&L number your accountant would recognise.
              </p>
              <Link
                href="/join#form"
                className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
              >
                Start free trial →
              </Link>
            </div>

            <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/15">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand-300">Illustrative P&L · 10-car fleet</p>
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
              <p className="mt-3 text-[11px] text-brand-500">Costs include maintenance, insurance amortisation & depreciation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Getting started</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          From sign-up to fully running in under an hour.
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl bg-surface-soft p-6 ring-1 ring-border">
              <span className="grid size-9 place-items-center rounded-full bg-brand-900 text-sm font-semibold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-base font-semibold text-brand-950">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section id="form" className="border-t border-border bg-surface-soft py-16 lg:py-20">
        <div className="mx-auto w-full max-w-lg px-6 text-center lg:px-8">
          <h2 className="text-2xl font-bold text-brand-950 sm:text-3xl">Ready to start?</h2>
          <p className="mt-3 text-sm text-neutral-500">
            Free during beta. No credit card. Takes 30 seconds.
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-white p-7 shadow-sm text-left">
            <JoinForm />
          </div>
          <p className="mt-5 text-xs text-neutral-400">
            Questions? Email us at{" "}
            <a href="mailto:info@carrentdesk.com" className="text-brand-700 hover:underline">
              info@carrentdesk.com
            </a>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} CarRentDesk ·{" "}
          <Link href="/for-rentals" className="hover:underline">For rental owners</Link>{" "}
          ·{" "}
          <Link href="/" className="hover:underline">Marketplace</Link>
        </p>
      </footer>
    </div>
  );
}
