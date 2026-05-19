import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./_components/join-form";

export const metadata: Metadata = {
  title: "Start free trial · CarRentDesk",
  description: "Manage your fleet, bookings and customers in one place. Free during beta.",
};

const BENEFITS = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: "Fleet management",
    desc: "All your cars in one place — fuel, inspections, insurance, odometer. Never miss a service date.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    title: "Bookings & availability calendar",
    desc: "Visual Gantt calendar, drag to create bookings, see every car's availability at a glance.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: "Customer database & risk tracking",
    desc: "Store driver history, licence details and flag problem customers so your whole team is protected.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Revenue overview",
    desc: "Monthly and yearly revenue, average booking value, per-car breakdown — always know your numbers.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 0 0 .284 2.253" />
      </svg>
    ),
    title: "More customers from the marketplace",
    desc: "Your company gets listed on CarRentDesk — customers across the Baltics find you directly, no commission.",
  },
];

export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-4">
        <Link href="/" className="text-sm font-bold text-brand-950">
          CarRentDesk
        </Link>
      </header>

      <main className="flex flex-1 items-stretch">
        {/* ── Left: pitch ── */}
        <div className="hidden w-1/2 flex-col justify-center bg-brand-950 px-12 py-16 lg:flex xl:px-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
            Free during beta
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white xl:text-4xl">
            Run your rental
            <br />like a pro.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-200">
            One platform for everything — cars, bookings,
            customers, and revenue. Built for independent
            rental companies in the Baltics.
          </p>

          <ul className="mt-10 space-y-6">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-brand-200">
                  {b.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-brand-300">{b.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-brand-800 pt-6">
            <p className="text-xs text-brand-400">
              Already have an account?{" "}
              <Link href="/app/login" className="font-medium text-brand-200 underline-offset-2 hover:underline">
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-sm">
            {/* Mobile headline */}
            <div className="mb-7 lg:hidden">
              <h1 className="text-2xl font-bold text-neutral-900">Start your free trial</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Fleet, bookings, customers & revenue — free during beta.
              </p>
            </div>

            {/* Desktop form heading */}
            <div className="mb-7 hidden lg:block">
              <h2 className="text-xl font-bold text-neutral-900">Create your account</h2>
              <p className="mt-1 text-sm text-neutral-500">Set up in 30 seconds. No credit card needed.</p>
            </div>

            <JoinForm />

            <div className="mt-6 lg:hidden">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-neutral-400">already have an account?</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <Link
                href="/app/login"
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-border bg-white py-3 text-sm font-semibold text-brand-700 hover:bg-slate-50"
              >
                Sign in →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
