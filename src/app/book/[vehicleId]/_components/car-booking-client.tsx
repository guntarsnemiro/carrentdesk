"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { carTitle, categoryLabel, fuelLabel, type PublicBookableCar } from "@/lib/booking/public-types";
import { formatEur } from "@/lib/booking/money";
import { formatDateTimeLabel } from "@/lib/booking/dates";
import { recordDemand } from "@/lib/booking/demand-client";
import {
  fuelPolicyLabel,
  hasCappedPrice,
  placeLabel,
  quoteOffer,
  selectionQuery,
  type CappedPrice,
  type InsuranceCode,
  type OfferSelection,
  type PublicOffer,
} from "@/lib/booking/offer";

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
  initialSelection: OfferSelection;
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
  initialSelection,
}: Props) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [selection, setSelection] = useState<OfferSelection>(initialSelection);
  const quote = useMemo(
    () => quoteOffer(car.dailyRate, car.days, offer, { ...selection, pickupTime, returnTime }),
    [car.dailyRate, car.days, offer, selection, pickupTime, returnTime],
  );
  function patch(next: Partial<OfferSelection>) {
    setSelection((prev) => {
      const merged = { ...prev, ...next };
      if (next.pickupPlaceId && offer) {
        const place = offer.places.find((item) => item.id === merged.pickupPlaceId);
        const code = place?.kind === "city" ? "city" : place?.kind === "airport" ? place.iataCode : place?.id;
        if (place && code) {
          void recordDemand({
            citySlug,
            pickupDate: pickupYmd,
            returnDate: returnYmd,
            pickupTime,
            returnTime,
            place: { kind: place.kind, code },
          });
        }
      }
      return merged;
    });
  }

  const when = `pickup=${pickupYmd}&return=${returnYmd}&pickupTime=${encodeURIComponent(pickupTime)}&returnTime=${encodeURIComponent(returnTime)}`;
  const offerQuery = selectionQuery({ ...selection, pickupTime, returnTime });
  const checkoutHref = `/book/${car.id}/checkout?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}&${when}&${offerQuery}`;
  const searchHref = `/${citySlug}?${when}`;
  const bits = [
    String(car.year),
    car.seats ? `${car.seats} seats` : null,
    fuelLabel(car.fuel),
    categoryLabel(car.category),
  ].filter(Boolean);
  const photo = car.photoUrls[activePhoto] ?? car.photoUrls[0];

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.4fr_1fr] lg:px-8">
      <div className="space-y-6">
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
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            {car.companyName} · {formatDateTimeLabel(pickupYmd, pickupTime)} – {formatDateTimeLabel(returnYmd, returnTime)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-brand-950">
            {carTitle(car)}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{bits.join(" · ")}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">
            You are booking this make and model or similar. The office may assign another car in
            the same class, or a free upgrade. A cheaper car is only used if you agree.
          </p>
        </div>

        {!car.available && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
            This car is not free for these dates.{" "}
            <Link href={searchHref} className="underline">
              See other cars
            </Link>
            .
          </p>
        )}

        {offer && (
          <OfferOptions
            offer={offer}
            days={car.days}
            depositBasic={car.depositBasic}
            selection={selection}
            onChange={patch}
          />
        )}
      </div>

      <aside className="lg:sticky lg:top-20 h-fit">
        <div className="rounded-2xl bg-background p-6 ring-1 ring-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Your quote · {car.days} {car.days === 1 ? "day" : "days"}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">
                {formatEur(car.dailyRate)} × {car.days} {car.days === 1 ? "day" : "days"}
              </dt>
              <dd className="font-medium text-brand-950">{formatEur(car.rentalTotal)}</dd>
            </div>
            {quote.lines.slice(1).map((line) => (
              <div key={line.id} className="flex justify-between gap-4">
                <dt className="text-neutral-600">{line.label}</dt>
                <dd className="font-medium text-brand-950">{formatEur(line.amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="font-medium text-brand-950">Rental at pickup</dt>
              <dd className="text-lg font-semibold text-brand-950">{formatEur(quote.rentalTotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-brand-950">Pay now to confirm</dt>
              <dd className="text-lg font-semibold text-brand-900">{formatEur(quote.platformFee)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Pay {formatEur(quote.platformFee)} now to confirm. Pay the rental ({formatEur(quote.rentalTotal)}) to {car.companyName} when you pick up the car.
          </p>
          {!car.available ? (
            <Link
              href={searchHref}
              className="mt-5 flex h-12 items-center justify-center rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Choose another car
            </Link>
          ) : offer && car.days < offer.minRentalDays ? (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This rental company asks for at least {offer.minRentalDays} days.
            </p>
          ) : (
            <Link
              href={checkoutHref}
              className="mt-5 flex h-12 items-center justify-center rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Continue · {formatEur(quote.platformFee)} now
            </Link>
          )}
          <Link
            href={searchHref}
            className="mt-3 block text-center text-sm text-neutral-500 hover:text-brand-900"
          >
            Back to cars
          </Link>
        </div>
      </aside>
    </div>
  );
}

function priceHint(price: CappedPrice): string {
  if (price.perDay != null && price.max != null) return `${formatEur(price.perDay)} per day, max ${formatEur(price.max)}`;
  if (price.perDay != null) return price.perDay > 0 ? `${formatEur(price.perDay)} per day` : "Included";
  if (price.max != null) return price.max > 0 ? `${formatEur(price.max)} for the rental` : "Included";
  return "";
}

function depositRule(code: InsuranceCode, basic: number | null): string {
  if (code === "full") return "No deposit with full insurance";
  return basic != null ? `Deposit ${formatEur(basic)} with basic insurance` : "";
}

function OfferOptions({
  offer,
  days,
  depositBasic,
  selection,
  onChange,
}: {
  offer: PublicOffer;
  days: number;
  depositBasic: number | null;
  selection: OfferSelection;
  onChange: (next: Partial<OfferSelection>) => void;
}) {
  const pickupPlaces = offer.places.filter((place) => place.pickupAllowed);
  const returnPlaces = offer.oneWayFee == null
    ? offer.places.filter((place) => place.id === selection.pickupPlaceId && place.returnAllowed)
    : offer.places.filter((place) => place.returnAllowed);
  const depositHow = [
    offer.depositPayCash ? "cash" : "",
    offer.depositPayCard ? "credit card" : "",
  ].filter(Boolean);
  const payments = [
    offer.payCash ? "cash" : "",
    offer.payCard ? "debit card" : "",
    offer.payTransfer ? "bank transfer" : "",
  ].filter(Boolean);
  const rules = [
    depositRule(selection.insuranceCode, depositBasic),
    depositHow.length ? `Deposit paid by ${depositHow.join(" or ")}` : "",
    offer.depositReturnedWhen ? `Deposit returned ${offer.depositReturnedWhen}` : "",
    offer.creditCardRequired ? "Credit card required" : "",
    payments.length ? `Pay the rental by ${payments.join(", ")}` : "",
    offer.unlimitedKm
      ? "Unlimited kilometres"
      : offer.kmPerDay != null
        ? `${offer.kmPerDay} km/day included${offer.extraKmPrice != null ? `, then ${formatEur(offer.extraKmPrice)}/km` : ""}`
        : "",
    fuelPolicyLabel(offer.fuelPolicy),
    offer.pricesIncludeVat ? "Prices include VAT" : "Prices exclude VAT",
    `Driver must be at least ${offer.minDriverAge}`,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      {pickupPlaces.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-brand-950">Pickup and return</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Pickup
              <select
                value={selection.pickupPlaceId ?? ""}
                onChange={(e) => onChange({
                  pickupPlaceId: e.target.value,
                  returnPlaceId: offer.oneWayFee == null ? e.target.value : selection.returnPlaceId,
                })}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-brand-950"
              >
                {pickupPlaces.map((place) => (
                  <option key={place.id} value={place.id}>{placeLabel(place, "pickup")}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Return
              <select
                value={selection.returnPlaceId ?? ""}
                onChange={(e) => onChange({ returnPlaceId: e.target.value })}
                disabled={offer.oneWayFee == null}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-brand-950 disabled:bg-surface-soft"
              >
                {returnPlaces.map((place) => (
                  <option key={place.id} value={place.id}>{placeLabel(place, "return")}</option>
                ))}
              </select>
            </label>
          </div>
          {(pickupPlaces.some((place) => place.id === selection.pickupPlaceId && place.kind === "city")
            || returnPlaces.some((place) => place.id === selection.returnPlaceId && place.kind === "city")) && (
            <p className="mt-2 text-sm text-neutral-500">The hotel or street is entered at checkout, and it has to be inside the city.</p>
          )}
        </div>
      )}

      {offer.insurance.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-brand-950">Insurance</h2>
          <ul className="mt-3 space-y-2">
            {offer.insurance.map((item) => {
              const amount = item.priceKind === "per_day" ? item.price * days : item.price;
              return (
                <li key={item.code}>
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-background px-4 py-3 ring-1 ring-border">
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="insurance"
                        checked={selection.insuranceCode === item.code}
                        onChange={() => onChange({ insuranceCode: item.code })}
                      />
                      <span>
                        <span className="block text-sm font-medium text-brand-950">{item.label}</span>
                        <span className="block text-xs text-neutral-500">
                          {item.code === "full"
                            ? "No deposit"
                            : depositBasic != null
                              ? `Deposit ${formatEur(depositBasic)}`
                              : "Deposit set on this car"}
                        </span>
                      </span>
                    </span>
                    <span className="text-sm font-medium text-brand-950">{amount > 0 ? formatEur(amount) : "Included"}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <OptionList
        title="Additional options"
        hint="Added to the rental, paid at pickup. The card fee updates with the new total."
        rows={[
          hasCappedPrice(offer.childSeat) ? {
            id: "infant",
            label: "Infant seat (0–1)",
            hint: priceHint(offer.childSeat),
            checked: selection.childSeatInfant,
            onChange: (childSeatInfant: boolean) => onChange({ childSeatInfant }),
          } : null,
          hasCappedPrice(offer.childSeat) ? {
            id: "toddler",
            label: "Toddler seat (1–6)",
            hint: priceHint(offer.childSeat),
            checked: selection.childSeatToddler,
            onChange: (childSeatToddler: boolean) => onChange({ childSeatToddler }),
          } : null,
          hasCappedPrice(offer.childSeat) ? {
            id: "child",
            label: "Child seat (6–12)",
            hint: priceHint(offer.childSeat),
            checked: selection.childSeatChild,
            onChange: (childSeatChild: boolean) => onChange({ childSeatChild }),
          } : null,
          hasCappedPrice(offer.additionalDriver) ? {
            id: "driver",
            label: "Additional driver",
            hint: priceHint(offer.additionalDriver),
            checked: selection.additionalDriver,
            onChange: (additionalDriver: boolean) => onChange({ additionalDriver }),
          } : null,
          hasCappedPrice(offer.gps) ? {
            id: "gps",
            label: "GPS",
            hint: priceHint(offer.gps),
            checked: selection.gps,
            onChange: (gps: boolean) => onChange({ gps }),
          } : null,
          hasCappedPrice(offer.airportDelivery) ? {
            id: "airport",
            label: "Airport delivery",
            hint: priceHint(offer.airportDelivery),
            checked: selection.airportDelivery,
            onChange: (airportDelivery: boolean) => onChange({ airportDelivery }),
          } : null,
          offer.crossBorderAllowed && hasCappedPrice(offer.crossBorder) ? {
            id: "border",
            label: "Cross-border travel",
            hint: [priceHint(offer.crossBorder), offer.crossBorderCountries.join(", ")].filter(Boolean).join(" · "),
            checked: selection.crossBorder,
            onChange: (crossBorder: boolean) => onChange({ crossBorder }),
          } : null,
        ].filter((row) => row != null)}
      />

      <div>
        <h2 className="text-lg font-semibold text-brand-950">Before you pay</h2>
        <ul className="mt-3 space-y-1 text-sm text-neutral-600">
          {rules.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
      </div>
    </div>
  );
}

function OptionList({
  title,
  hint,
  rows,
}: {
  title: string;
  hint: string;
  rows: { id: string; label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-950">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{hint}</p>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-background px-4 py-3 ring-1 ring-border">
              <span className="flex items-center gap-3">
                <input type="checkbox" checked={row.checked} onChange={(e) => row.onChange(e.target.checked)} className="h-4 w-4 rounded border-border text-brand-700" />
                <span>
                  <span className="block text-sm font-medium text-brand-950">{row.label}</span>
                  <span className="block text-xs text-neutral-500">{row.hint}</span>
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
