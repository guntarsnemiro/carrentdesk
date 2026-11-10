"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CITIES, cityAirports } from "@/lib/cities";
import { DateTimeRangeFields } from "@/components/booking/datetime-range-fields";
import {
  addDaysYmd,
  defaultPickupYmd,
  defaultReturnYmd,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  isValidDateTimeRange,
  isValidRange,
} from "@/lib/booking/dates";
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
  const [placeCode, setPlaceCode] = useState<string | null>(null);
  const [pickup, setPickup] = useState(defaultPickupYmd);
  const [returnDate, setReturnDate] = useState(() => defaultReturnYmd(defaultPickupYmd()));
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);
  const [returnTime, setReturnTime] = useState(DEFAULT_RETURN_TIME);
  const [query, setQuery] = useState("Riga");
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const committedLabel = useRef("Riga");
  const pinningCity = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const cityLabel = useCallback((slug: string, code: string | null = placeCode) => {
    if (slug === "all") return "All cities";
    const c = CITIES.find((c) => c.slug === slug);
    if (!c) return "";
    if (code === "city") return `${c.name}, city delivery`;
    const airport = code ? cityAirports(c).find((item) => item.code === code) : null;
    return airport?.name ?? `${c.name}, ${c.country}`;
  }, [placeCode]);

  // Recalculate dropdown position whenever it opens or the page scrolls
  const updateDropdownPos = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 360),
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

  const cityMatches = (c: (typeof CITIES)[number]) =>
    normalize(c.name).includes(q) ||
    normalize(c.country).includes(q) ||
    c.slug.includes(q) ||
    cityAirports(c).some(
      (airport) =>
        normalize(airport.name).includes(q) ||
        airport.code.toLowerCase().includes(q),
    );

  const filteredGroups = CITY_GROUPS.map(({ 0: country, 1: cities }) => ({
    country,
    cities: cities.filter(cityMatches),
  })).filter((g) => g.cities.length > 0);

  const matchCount = filteredGroups.reduce((sum, group) => sum + group.cities.length, 0);
  const expandLocations = q.length > 0 && matchCount > 0 && matchCount <= 6;

  const showAll = query === "" || "all cities".includes(q);

  function selectAllCities() {
    committedLabel.current = "All cities";
    setCitySlug("all");
    setPlaceCode(null);
    setQuery("All cities");
    setOpen(false);
  }

  function focusCity(slug: string) {
    const c = CITIES.find((item) => item.slug === slug);
    pinningCity.current = true;
    committedLabel.current = c?.name ?? "";
    setCitySlug(slug);
    setPlaceCode(null);
    setQuery(c?.name ?? "");
    setOpen(true);
  }

  function selectLocation(slug: string, code: string) {
    const label = cityLabel(slug, code);
    committedLabel.current = label;
    setCitySlug(slug);
    setPlaceCode(code);
    setQuery(label);
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
      if (pinningCity.current) {
        pinningCity.current = false;
        return;
      }
      if (document.activeElement !== inputRef.current && !listRef.current?.contains(document.activeElement)) {
        setQuery(committedLabel.current);
        setOpen(false);
      }
    }, 150);
  }

  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (
      !containerRef.current?.contains(e.target as Node) &&
      !listRef.current?.contains(e.target as Node)
    ) {
      setQuery(committedLabel.current);
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [handleOutsideClick]);

  function onPickupChange(value: string) {
    setPickup(value);
    if (!isValidDateTimeRange(value, pickupTime, returnDate, returnTime)) {
      setReturnDate(addDaysYmd(value, 3));
    }
  }

  function onPickupTimeChange(value: string) {
    setPickupTime(value);
    if (!isValidDateTimeRange(pickup, value, returnDate, returnTime)) {
      setReturnDate(addDaysYmd(pickup, 3));
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const path = citySlug === "all" ? "/all" : `/${citySlug}`;
    const params = new URLSearchParams();
    if (citySlug !== "all") {
      const nextReturn = isValidRange(pickup, returnDate) ? returnDate : addDaysYmd(pickup, 3);
      params.set("pickup", pickup);
      params.set("return", nextReturn);
      params.set("pickupTime", pickupTime);
      params.set("returnTime", returnTime);
      if (placeCode) params.set("place", placeCode);
    }
    const qs = params.toString();
    router.push(qs ? `${path}?${qs}` : path);
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
          onMouseDown={() => selectAllCities()}
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
            {cities.map((c) =>
              expandLocations ? (
                <div key={c.slug} className="pb-1">
                  <p className="px-4 pt-2 text-xs font-semibold text-brand-950">{c.name}</p>
                  <button
                    type="button"
                    onMouseDown={() => selectLocation(c.slug, "city")}
                    className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-surface-soft ${citySlug === c.slug && placeCode === "city" ? "font-semibold text-brand-900" : "text-neutral-700"}`}
                  >
                    City delivery
                  </button>
                  {cityAirports(c).map((airport) => (
                    <button
                      key={airport.code}
                      type="button"
                      onMouseDown={() => selectLocation(c.slug, airport.code)}
                      className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-surface-soft ${citySlug === c.slug && placeCode === airport.code ? "font-semibold text-brand-900" : "text-neutral-700"}`}
                    >
                      {airport.name}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  key={c.slug}
                  type="button"
                  onMouseDown={() => focusCity(c.slug)}
                  className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-surface-soft ${citySlug === c.slug ? "font-semibold text-brand-900" : "text-neutral-700"}`}
                >
                  {c.name}
                </button>
              ),
            )}
          </div>
        ))
      )}
    </div>,
    document.body
  ) : null;

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 flex w-full max-w-full flex-col gap-2 rounded-2xl bg-white p-2 text-left shadow-2xl ring-1 ring-black/10 sm:w-fit sm:flex-row sm:items-stretch sm:gap-0 sm:p-1.5"
    >
      {/* City search — wide enough for the longest city name, not the leftover bar */}
      <div ref={containerRef} className="relative flex w-full shrink-0 sm:w-72">
        <label className="group flex w-full flex-col justify-center rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-soft">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Where
          </span>
          <span className="relative mt-0.5 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={onInputChange}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="Search city or airport…"
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
      <DateTimeRangeFields
        pickup={pickup}
        returnDate={returnDate}
        pickupTime={pickupTime}
        returnTime={returnTime}
        onPickupChange={onPickupChange}
        onReturnChange={setReturnDate}
        onPickupTimeChange={onPickupTimeChange}
        onReturnTimeChange={setReturnTime}
      />
      <button
        type="submit"
        className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-brand-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800 sm:h-auto sm:px-8"
      >
        Search
      </button>
    </form>
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
