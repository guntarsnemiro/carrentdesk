"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CityAirport } from "@/lib/cities";
import { formatDateTimeLabel } from "@/lib/booking/dates";
import { recordDemand } from "@/lib/booking/demand-client";

type Props = {
  citySlug: string;
  cityName: string;
  airports: CityAirport[];
};

export function DemandCapture({ citySlug, cityName, airports }: Props) {
  const searchParams = useSearchParams();
  const pickup = searchParams.get("pickup") ?? "";
  const returnDate = searchParams.get("return") ?? "";
  const pickupTime = searchParams.get("pickupTime") ?? "";
  const returnTime = searchParams.get("returnTime") ?? "";
  const placeParam = searchParams.get("place") ?? "";
  const chosenAirport = airports.find((airport) => airport.code === placeParam) ?? null;
  const placeKind = placeParam === "city" ? "city" : chosenAirport ? "airport" : "";
  const placeCodeFromUrl = placeKind === "city" ? "city" : chosenAirport?.code ?? "";
  const [placeCode, setPlaceCode] = useState<string | null>(placeCodeFromUrl || null);

  useEffect(() => {
    if (!pickup || !returnDate || !pickupTime || !returnTime) return;
    void recordDemand({
      citySlug,
      pickupDate: pickup,
      returnDate,
      pickupTime,
      returnTime,
      ...(placeKind === "city" || placeKind === "airport"
        ? { place: { kind: placeKind, code: placeCodeFromUrl } }
        : {}),
    });
  }, [citySlug, pickup, returnDate, pickupTime, returnTime, placeKind, placeCodeFromUrl]);

  if (!pickup || !returnDate || !pickupTime || !returnTime || placeKind) return null;

  const options = [
    { kind: "city" as const, code: "city", label: "City delivery" },
    ...airports.map((airport) => ({ kind: "airport" as const, code: airport.code, label: airport.name })),
  ];

  function choose(kind: "city" | "airport", code: string) {
    setPlaceCode(code);
    void recordDemand({
      citySlug,
      pickupDate: pickup,
      returnDate,
      pickupTime,
      returnTime,
      place: { kind, code },
    });
  }

  return (
    <div className="mb-8 rounded-2xl bg-surface-soft p-5 ring-1 ring-border">
      <p className="text-sm font-semibold text-brand-950">Where do you want the car in {cityName}?</p>
      <p className="mt-1 text-sm text-neutral-600">
        {formatDateTimeLabel(pickup, pickupTime)} – {formatDateTimeLabel(returnDate, returnTime)}. This does not book a car. It shows which place people are looking for.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = placeCode === option.code;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => choose(option.kind, option.code)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors ${
                selected
                  ? "bg-brand-900 text-white ring-brand-900"
                  : "bg-background text-brand-900 ring-border hover:bg-brand-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
