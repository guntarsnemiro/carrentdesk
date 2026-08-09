"use client";

/**
 * Client wrapper that lets the user flip between the default list view (split
 * into verified-card grid + unverified row list) and a map view that pins
 * every listing in the current filter onto an OpenStreetMap canvas.
 *
 * Also owns the vehicle-type filter chips so the parent server page never
 * needs to read searchParams — keeping it statically cached (ISR).
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Listing } from "@/lib/listings-types";
import { ListingCard } from "@/components/marketing/listing-card";
import { ListingRowList } from "@/components/marketing/listing-row";
import { VEHICLE_TYPES, getVehicleType } from "@/lib/vehicle-types";

const ListingsMap = dynamic(
  () => import("@/components/marketing/listings-map"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[560px] place-items-center rounded-2xl bg-surface-soft ring-1 ring-border">
        <p className="text-sm text-neutral-500">Loading map…</p>
      </div>
    ),
  },
);

type Props = {
  listings: Listing[];
  cityName: string;
  citySlug: string;
  /**
   * Used as the initial map center when no listings have coordinates.
   * Pass a sensible city-center fallback (e.g. Riga = [56.95, 24.11]).
   */
  mapFallbackCenter: [number, number];
};

export function CityListingsView({
  listings,
  cityName,
  citySlug,
  mapFallbackCenter,
}: Props) {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") ?? undefined;
  const activeType = VEHICLE_TYPES.some((v) => v.key === typeParam) ? typeParam : undefined;
  const activeMeta = activeType ? getVehicleType(activeType) : undefined;

  // Filter listings client-side so the parent page stays statically cached.
  // Listings with an empty vehicleTypes array are shown in "All" only.
  const filtered = activeType
    ? listings.filter((l) => l.vehicleTypes.includes(activeType as never))
    : listings;

  // Map is the default landing view on city pages so visitors immediately
  // see where each rental sits relative to the airport / city center / their
  // destination. The list is always rendered underneath in map mode, so
  // nothing is hidden from the user.
  const [view, setView] = useState<"list" | "map">("map");

  const verified = filtered.filter((l) => l.status === "verified");
  const rest = filtered.filter((l) => l.status !== "verified");
  const onMap = filtered.filter((l) => !!l.coordinates).length;
  const missing = filtered.length - onMap;

  const list = (
    <div className="space-y-10">
      {verified.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-brand-950">
            Verified rentals
            {activeMeta && <span className="font-normal text-neutral-500"> · {activeMeta.label}</span>}
          </h2>
          <p className="mt-0.5 text-sm text-neutral-600">
            Operators on the CarRentDesk operations platform.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {verified.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
      {rest.length > 0 && (
        <ListingRowList
          listings={rest}
          title={
            verified.length > 0
              ? `Other rentals in ${cityName}`
              : `Rentals in ${cityName}`
          }
          subtitle={
            verified.length > 0
              ? "Independent operators we've listed. Contact them directly."
              : "Independent local operators. Contact them directly."
          }
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Vehicle-type filter chips */}
      <div className="-mx-1 flex flex-wrap items-center gap-1.5 overflow-x-auto px-1 pb-1">
        <Chip href={`/${citySlug}`} active={!activeType}>
          All types
        </Chip>
        {VEHICLE_TYPES.map((v) => (
          <Chip key={v.key} href={`/${citySlug}?type=${v.key}`} active={activeType === v.key}>
            {v.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-soft p-10 text-center">
          <h2 className="text-lg font-semibold text-brand-950">
            {activeMeta
              ? `No ${activeMeta.label.toLowerCase()} rentals listed yet in ${cityName}`
              : `No listings yet for ${cityName}`}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            We&apos;re actively adding rentals here. Try another car type, or{" "}
            <Link href="/join" className="text-brand-700 hover:underline">
              list your rental
            </Link>{" "}
            if you operate in {cityName}.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <ViewToggle view={view} onChange={setView} onMap={onMap} />

          {view === "map" && (
            <div className="space-y-3">
              <ListingsMap
                listings={filtered}
                fallbackCenter={mapFallbackCenter}
              />
              <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
                <p>
                  {onMap} {onMap === 1 ? "rental" : "rentals"} on the map
                  {missing > 0 && (
                    <>
                      {" "}
                      · {missing} not shown yet (location pending)
                    </>
                  )}
                </p>
                <p className="hidden sm:block">
                  All {filtered.length}{" "}
                  {filtered.length === 1 ? "rental is" : "rentals are"} listed
                  below.
                </p>
              </div>
            </div>
          )}

          {/* The list is always rendered. In map view it sits below the map so
              the user can scan the same set of rentals as a structured list
              without losing the spatial context above. */}
          {list}
        </div>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-900 bg-brand-900 text-white"
          : "border-border bg-background text-brand-900 hover:bg-brand-50"
      }`}
    >
      {children}
    </Link>
  );
}


const ListingsMap = dynamic(
  () => import("@/components/marketing/listings-map"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[560px] place-items-center rounded-2xl bg-surface-soft ring-1 ring-border">
        <p className="text-sm text-neutral-500">Loading map…</p>
      </div>
    ),
  },
);

type Props = {
  listings: Listing[];
  cityName: string;
  /**
   * Used as the initial map center when no listings have coordinates.
   * Pass a sensible city-center fallback (e.g. Riga = [56.95, 24.11]).
   */
  mapFallbackCenter: [number, number];
};

export function CityListingsView({
  listings,
  cityName,
  mapFallbackCenter,
}: Props) {
  // Map is the default landing view on city pages so visitors immediately
  // see where each rental sits relative to the airport / city center / their
  // destination. The list is always rendered underneath in map mode, so
  // nothing is hidden from the user.
  const [view, setView] = useState<"list" | "map">("map");

  const verified = listings.filter((l) => l.status === "verified");
  const rest = listings.filter((l) => l.status !== "verified");
  const onMap = listings.filter((l) => !!l.coordinates).length;
  const missing = listings.length - onMap;

  const list = (
    <div className="space-y-10">
      {verified.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-brand-950">
            Verified rentals
          </h2>
          <p className="mt-0.5 text-sm text-neutral-600">
            Operators on the CarRentDesk operations platform.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {verified.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
      {rest.length > 0 && (
        <ListingRowList
          listings={rest}
          title={
            verified.length > 0
              ? `Other rentals in ${cityName}`
              : `Rentals in ${cityName}`
          }
          subtitle={
            verified.length > 0
              ? "Independent operators we've listed. Contact them directly."
              : "Independent local operators. Contact them directly."
          }
        />
      )}
    </div>
  );

  return (
    <div className="space-y-10">
      <ViewToggle view={view} onChange={setView} onMap={onMap} />

      {view === "map" && (
        <div className="space-y-3">
          <ListingsMap
            listings={listings}
            fallbackCenter={mapFallbackCenter}
          />
          <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
            <p>
              {onMap} {onMap === 1 ? "rental" : "rentals"} on the map
              {missing > 0 && (
                <>
                  {" "}
                  · {missing} not shown yet (location pending)
                </>
              )}
            </p>
            <p className="hidden sm:block">
              All {listings.length}{" "}
              {listings.length === 1 ? "rental is" : "rentals are"} listed
              below.
            </p>
          </div>
        </div>
      )}

      {/* The list is always rendered. In map view it sits below the map so
          the user can scan the same set of rentals as a structured list
          without losing the spatial context above. */}
      {list}
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
  onMap,
}: {
  view: "list" | "map";
  onChange: (v: "list" | "map") => void;
  onMap: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        role="tablist"
        aria-label="Listing view"
        className="inline-flex rounded-full border border-border bg-background p-0.5 text-sm font-medium"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "list"}
          onClick={() => onChange("list")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors ${
            view === "list"
              ? "bg-brand-900 text-white"
              : "text-brand-900 hover:bg-brand-50"
          }`}
        >
          <ListIcon />
          List
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "map"}
          onClick={() => onChange("map")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors ${
            view === "map"
              ? "bg-brand-900 text-white"
              : "text-brand-900 hover:bg-brand-50"
          }`}
        >
          <MapIcon />
          Map
          <span
            className={`ml-1 rounded-full px-1.5 text-[10px] font-semibold ${
              view === "map"
                ? "bg-white/15 text-white"
                : "bg-brand-100 text-brand-900"
            }`}
          >
            {onMap}
          </span>
        </button>
      </div>
    </div>
  );
}

function ListIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
