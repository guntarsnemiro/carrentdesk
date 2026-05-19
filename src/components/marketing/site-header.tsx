"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CITIES } from "@/lib/cities";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-brand-900 text-[11px] font-bold text-white"
          >
            CR
          </span>
          <span className="text-[15px] text-brand-900">CarRentDesk</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-neutral-700 md:flex">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="transition-colors hover:text-brand-900"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/join"
            className="hidden text-sm text-neutral-400 transition-colors hover:text-brand-700 md:inline-flex"
          >
            For rental owners
          </Link>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-md text-brand-900 hover:bg-surface-soft md:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {open ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-border bg-background md:hidden"
        >
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3">
            {CITIES.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="rounded-lg px-3 py-2 text-base font-medium text-brand-900 hover:bg-surface-soft"
              >
                {c.name}, {c.country}
              </Link>
            ))}
            <Link
              href="/all"
              className="rounded-lg px-3 py-2 text-base font-medium text-brand-900 hover:bg-surface-soft"
            >
              All rentals
            </Link>
            <div className="my-2 h-px bg-border" />
            <Link
              href="/join"
              className="rounded-lg px-3 py-2 text-base font-medium text-neutral-500 hover:bg-surface-soft"
            >
              For rental owners
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
