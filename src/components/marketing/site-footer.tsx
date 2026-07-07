"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CITIES } from "@/lib/cities";

// Sort cities alphabetically for the footer grid
const SORTED_CITIES = [...CITIES].sort((a, b) => a.name.localeCompare(b.name));

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/app") || pathname.startsWith("/join")) return null;

  return (
    <footer className="mt-16 border-t border-border bg-surface-soft">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden
              className="grid h-7 w-7 place-items-center rounded-md bg-brand-900 text-[11px] font-bold text-white"
            >
              CR
            </span>
            <span className="text-[15px] text-brand-900">CarRentDesk</span>
          </div>
          <p className="max-w-xs text-sm leading-6 text-neutral-600">
            Compare local, independent car rentals across the Baltics and Scandinavia.
          </p>
        </div>

        <div className="sm:col-span-1 lg:col-span-1">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Cities
          </h4>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-neutral-700">
            {SORTED_CITIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="hover:text-brand-900">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/all" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:text-brand-900">
            All cities →
          </Link>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            For rental owners
          </h4>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <li>
              <Link href="/join" className="hover:text-brand-900">
                Why CarRentDesk
              </Link>
            </li>
            <li>
              <Link href="/join" className="hover:text-brand-900">
                Claim your listing
              </Link>
            </li>
            <li>
              <Link href="/join#pricing" className="hover:text-brand-900">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Company
          </h4>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <li>
              <Link href="/about" className="hover:text-brand-900">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand-900">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-brand-900">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-brand-900">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-6 py-4 text-xs text-neutral-500 lg:flex-row lg:items-center lg:px-8">
          <p>© {new Date().getFullYear()} CarRentDesk. Baltics &amp; Scandinavia.</p>
          <p>
            Need help? Email{" "}
            <a
              href="mailto:info@carrentdesk.com"
              className="text-neutral-700 hover:text-brand-900"
            >
              info@carrentdesk.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
