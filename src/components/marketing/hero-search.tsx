"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

export function HeroSearch() {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState("riga");
  const [type, setType] = useState("any");
  const [query, setQuery] = useState("Riga");
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const cityLabel = useCallback((slug: string) => {
    if (slug === "all") return "All cities";
    const c = CITIES.find((c) => c.slug === slug);
    return c ? `${c.name}, ${c.country}` : "";
  }, []);

  // Recalculate dropdown position whenever it opens or the page scrolls
  const updateDropdownPos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateDropdownPos();
    window.addEventListener("scroll", updateDropdownPos, { passive: true });
    window.addEventListener("resize", updateDropdownPos, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateDropdownPos);
      window.removeEventListener("resize", updateDropdownPos);
    };
  }, [open, updateDropdownPos]);

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const q = normalize(query);

  const filteredGroups = CITY_GROUPS.map(({ 0: country, 1: cities }) => ({
    country,
    cities: cities.filter(
      (c) =>
        normalize(c.name).includes(q) ||
        normalize(c.country).includes(q) ||
        c.slug.includes(q)
    ),
  })).filter((g) => g.cities.length > 0);

  const showAll = query === "" || "all cities".includes(q);

  function selectCity(slug: string) {
    setCitySlug(slug);
    setQuery(cityLabel(slug));
    setOpen(false);
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
    setTimeout(() => {
      if (document.activeElement !== inputRef.current && !listRef.current?.contains(document.activeElement)) {
        setQuery(cityLabel(citySlug));
        setOpen(false);
      }
    }, 150);
  }

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (
      !containerRef.current?.contains(e.target as Node) &&
      !listRef.current?.contains(e.target as Node)
    ) {
      setQuery(cityLabel(citySlug));
      setOpen(false);
    }
  }, [citySlug, cityLabel]);

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

  const dropdown = mounted && open ? createPortal(
    <div
      ref={listRef}
      style={dropdownStyle}
      className="max-h-72 overflow-y-auto rounded-xl border border-border bg-white shadow-2xl"
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
    </div>,
    document.body
  ) : null;

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
      </div>

      {dropdown}

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
