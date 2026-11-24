"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { carTitle, categoryLabel, fuelLabel, type PublicBookableCar } from "@/lib/booking/public-types";
import { formatEur } from "@/lib/booking/money";
import { formatDateTimeLabel } from "@/lib/booking/dates";
import { fuelPolicyLabel, type PublicOffer } from "@/lib/booking/offer";

type Props = {
  car: PublicBookableCar;
  startIso: string;
  endIso: string;
  pickupYmd: string;
  returnYmd: string;
  pickupTime: string;
  returnTime: string;
  citySlug: string;
  offer: PublicOffer | null;
  /** true when the offer has insurance/pickup choices worth showing on the options page */
  hasOptions: boolean;
};

export function CarBookingClient({
  car,
  startIso,
  endIso,
  pickupYmd,
  returnYmd,
  pickupTime,
  returnTime,
  citySlug,
  offer,
  hasOptions,
}: Props) {
  const [activePhoto, setActivePhoto] = useState(0);
  const photo = car.photoUrls[activePhoto] ?? car.photoUrls[0];

  const when = `pickup=${pickupYmd}&return=${returnYmd}&pickupTime=${encodeURIComponent(pickupTime)}&returnTime=${encodeURIComponent(returnTime)}`;
  const startEnd = `start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;

  const nextHref = hasOptions
    ? `/book/${car.id}/options?${startEnd}&${when}`
    : `/book/${car.id}/checkout?${startEnd}&${when}`;

  const searchHref = `/${citySlug}?${when}`;

  const bits = [
    String(car.year),
    car.seats ? `${car.seats} seats` : null,
    fuelLabel(car.fuel),
    categoryLabel(car.category),
  ].filter(Boolean);

  const rules = offer ? [
    offer.unlimitedKm
      ? "Unlimited kilometres"
      : offer.kmPerDay != null
        ? `${offer.kmPerDay} km/day included`
        : null,
    fuelPolicyLabel(offer.fuelPolicy),
    `Minimum driver age ${offer.minDriverAge}`,
    offer.minRentalDays > 1 ? `Minimum rental ${offer.minRentalDays} days` : null,
  ].filter(Boolean) as string[] : [];

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.4fr_1fr] lg:px-8">

      {/* ── Left — photos + car info ── */}
      <div className="space-y-6">

        {/* Photo gallery */}
        <div className="overflow-hidden rounded-2xl bg-surface-soft ring-1 ring-border">
          <div className="relative aspect-[16/10] w-full bg-neutral-100">
            {photo ? (
              <Image
                src={photo}
                alt={carTitle(car)}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : null}
          </div>
          {car.photoUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {car.photoUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ${
                    i === activePhoto ? "ring-brand-900" : "ring-transparent"
                  }`}
                >
                  <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Car title */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            {car.companyName}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-brand-950">
            {carTitle(car)}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{bits.join(" · ")}</p>
        </div>

        {/* Rules */}
        {rules.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-brand-950">Rules</h2>
            <ul className="mt-3 space-y-1 text-sm text-neutral-600">
              {rules.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}

        {/* Small print */}
        <p className="text-xs leading-5 text-neutral-400">
          The office may assign an equivalent or better car. A cheaper substitute is only offered with your agreement.
        </p>
      </div>

      {/* ── Right — sticky booking CTA ── */}
      <aside className="h-fit lg:sticky lg:top-20">
        <div className="rounded-2xl bg-background p-6 ring-1 ring-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {car.days} {car.days === 1 ? "day" : "days"}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {formatDateTimeLabel(pickupYmd, pickupTime)}
          </p>
          <p className="text-sm text-neutral-600">
            {formatDateTimeLabel(returnYmd, returnTime)}
          </p>

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm text-neutral-500">From</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-brand-950">
              {formatEur(car.dailyRate)}
              <span className="ml-1 text-sm font-normal text-neutral-500">/day</span>
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Trip total ~{formatEur(car.rentalTotal)} · paid at pickup
            </p>
          </div>

          {!car.available ? (
            <div className="mt-5 space-y-3">
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
                Not available for these dates.
              </p>
              <Link
                href={searchHref}
                className="flex h-12 items-center justify-center rounded-xl border border-border text-sm font-semibold text-neutral-700 hover:bg-surface-soft"
              >
                See other cars
              </Link>
            </div>
          ) : (
            <Link
              href={nextHref}
              className="mt-5 flex h-12 items-center justify-center rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Book this car →
            </Link>
          )}

          <Link
            href={searchHref}
            className="mt-3 block text-center text-sm text-neutral-500 hover:text-brand-900"
          >
            Change dates or car
          </Link>
        </div>
      </aside>
    </div>
  );
}
