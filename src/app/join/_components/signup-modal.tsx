"use client";

import { useState, useEffect } from "react";
import { JoinForm } from "./join-form";
import { CITIES } from "@/lib/cities";
import { COUNTRY_OPTIONS } from "@/lib/join/countries";

const cityOptions = CITIES.map((c) => ({
  slug: c.slug,
  name: c.name,
  country: c.country,
})).sort((a, b) => a.name.localeCompare(b.name));

const countryOptions = COUNTRY_OPTIONS;

type Props = {
  label?: string;
  className?: string;
};

export function SignupCTAButton({
  label = "Add your fleet — it's free →",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  /* lock body scroll while modal is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
        }
      >
        {label}
      </button>

      {open && (
        /* backdrop */
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16 backdrop-blur-sm sm:items-center sm:pt-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* modal card */}
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-7 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            >
              ×
            </button>

            <h2 className="text-xl font-bold text-neutral-900">
              Add your fleet — free
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Create your account. Add your cars. Start getting bookings.
            </p>

            <div className="mt-6">
              <JoinForm cityOptions={cityOptions} countryOptions={countryOptions} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
