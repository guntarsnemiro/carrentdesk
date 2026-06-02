"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { CITIES } from "@/lib/cities";
import { VEHICLE_TYPES } from "@/lib/vehicle-types";

// Group cities by country for the dropdown
const CITY_GROUPS = Object.entries(
  CITIES.reduce<Record<string, typeof CITIES>>((acc, city) => {
    if (!acc[city.country]) acc[city.country] = [];
    acc[city.country].push(city);
    return acc;
  }, {})
).sort(([a], [b]) => a.localeCompare(b));

const ALL_OPTION = { slug: "all", name: "All cities", country: "" };

export function HeroSearch() {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState("riga");
  const [type, setType] = useState("any");
  const [query, setQuery] = useState("Riga");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cityLabel = (slug: string) => {
    if (slug === "all") return "All cities";
    const c = CITIES.find((c) => c.slug === slug);
    return c ? `${c.name}, ${c.country}` : "";
  };

  const filteredGroups = CITY_GROUPS.map(([country, cities]) => ({
    country,
    cities: cities.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.country.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((g) => g.cities.length > 0);

  const showAll = "all cities".includes(query.toLowerCase()) || query === "";

  function selectCity(slug: string) {
    setCitySlug(slug);
    setQuery(cityLabel(slug));
    setOpen(false);
    inputRef.current?.blur();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
  }

  function onFocus() {
    setQuery("");
    setOpen(true);
  }

  function onBlur() {
    // Delay so clicks in the list register first
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setQuery(cityLabel(citySlug));
        setOpen(false);
      }
    }, 150);
  }

  // Close on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (!containerRef.current?.contains(e.target as Node)) {
      setQuery(cityLabel(citySlug));
      setOpen(false);
    }
  }, [citySlug]);

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [handleOutsideClick]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const path = citySlug === "all" ? "/all" : `/${citySlug}`;
    const params = type !== "any" ? `?type=${type}` : "";
    router.push(`${path}${params}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 text-left shadow-2xl ring-1 ring-black/10 sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
    >
      {/* City search */}
      <div ref={containerRef} className="relative flex flex-1">
        <label className="group flex flex-1 flex-col justify-center rounded-xl px-4 py-2.5 transition-colors hover:bg-surface-soft">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            City
          </span>
          <span className="relative mt-0.5 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={onInputChange}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="Search city…"
              autoComplete="off"
              className="w-full bg-transparent pr-6 text-sm font-medium text-brand-950 outline-none placeholder:text-neutral-400"
            />
            <span aria-hidden className="pointer-events-none absolute right-0 text-neutral-400">
              ▾
            </span>
          </span>
        </label>

        {open && (
          <div
            ref={listRef}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-white shadow-xl"
          >
            {showAll && (
              <button
                type="button"
                onMouseDown={() => selectCity("all")}
                className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-surface-soft ${citySlug === "all" ? "font-semibold text-brand-900" : "text-neutral-700"}`}
              >
                All cities
              </button>
            )}

            {filteredGroups.length === 0 && !showAll ? (
              <p className="px-4 py-3 text-sm text-neutral-400">No cities found</p>
            ) : (
              filteredGroups.map(({ country, cities }) => (
                <div key={country}>
                  <p className="sticky top-0 bg-surface-soft px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    {country}
                  </p>
                    {cities.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onMouseDown={() => selectCity(c.slug)}
                      className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-surface-soft ${citySlug === c.slug ? "font-semibold text-brand-900" : "text-neutral-700"}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Divider />

      {/* Car type */}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="group flex flex-1 flex-col justify-center rounded-xl px-4 py-2.5 transition-colors hover:bg-surface-soft">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="relative mt-0.5 flex items-center">
        {children}
        <span aria-hidden className="pointer-events-none absolute right-0 text-neutral-400">
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
