"use client";

import dynamic from "next/dynamic";

const LocationMap = dynamic(
  () => import("./location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 h-48 w-full animate-pulse rounded-lg bg-slate-100 ring-1 ring-border" />
    ),
  }
);

export function LocationMapLoader(props: { lat: number; lng: number; label?: string }) {
  return <LocationMap {...props} />;
}
