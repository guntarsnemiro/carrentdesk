"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES } from "@/lib/cities";
import { VEHICLE_TYPES } from "@/lib/vehicle-types";

export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState<string>("riga");
  const [type, setType] = useState<string>("any");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const path = city === "all" ? "/all" : `/${city}`;
    const params = type !== "any" ? `?type=${type}` : "";
    router.push(`${path}${params}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 text-left shadow-2xl ring-1 ring-black/10 sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
    >
      <Field label="City">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-brand-950 outline-none"
        >
          <option value="all">All cities</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}, {c.country}
            </option>
          ))}
        </select>
      </Field>

      <Divider />

      <Field label="Car type">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-brand-950 outline-none"
        >
          <option value="any">Any type</option>
          {VEHICLE_TYPES.map((v) => (
            <option key={v.key} value={v.key}>
              {v.label}
            </option>
          ))}
        </select>
      </Field>

      <button
        type="submit"
        className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-brand-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800 sm:h-auto sm:px-8"
      >
        Search
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex flex-1 flex-col justify-center rounded-xl px-4 py-2.5 transition-colors hover:bg-surface-soft">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="relative mt-0.5 flex items-center">
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 text-neutral-400"
        >
          ▾
        </span>
      </span>
    </label>
  );
}

function Divider() {
  return (
    <span
      aria-hidden
      className="hidden self-stretch bg-border sm:my-1 sm:block sm:w-px"
    />
  );
}
