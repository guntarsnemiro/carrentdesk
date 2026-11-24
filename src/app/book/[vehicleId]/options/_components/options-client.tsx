"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { carTitle, type PublicBookableCar } from "@/lib/booking/public-types";
import { formatEur } from "@/lib/booking/money";
import { formatDateTimeLabel } from "@/lib/booking/dates";
import {
  hasCappedPrice,
  quoteOffer,
  selectionQuery,
  type CappedPrice,
  type InsuranceCode,
  type OfferPlace,
  type OfferSelection,
  type PublicOffer,
} from "@/lib/booking/offer";

type Props = {
  car: PublicBookableCar;
  offer: PublicOffer;
  startIso: string;
  endIso: string;
  pickupYmd: string;
  returnYmd: string;
  pickupTime: string;
  returnTime: string;
  citySlug: string;
  initialSelection: OfferSelection;
};

// ── Insurance card ────────────────────────────────────────────────────────────

function InsuranceCard({
  code,
  label,
  price,
  days,
  depositBasic,
  selected,
  onSelect,
}: {
  code: InsuranceCode;
  label: string;
  price: number;
  days: number;
  depositBasic: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const totalExtra = price * days;
  const deposit = code === "full" ? null : depositBasic;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
        selected
          ? "border-brand-700 bg-brand-50"
          : "border-border bg-background hover:border-brand-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected ? "border-brand-700 bg-brand-700" : "border-neutral-300"
            }`}
          >
            {selected && (
              <span className="h-2 w-2 rounded-full bg-white" />
            )}
          </span>
          <div>
            <p className="font-semibold text-brand-950">{label}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {code === "full"
                ? "No deposit · no excess · fully covered"
                : deposit != null
                  ? `Deposit ${formatEur(deposit)} at pickup`
                  : "Basic coverage included"}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {totalExtra > 0 ? (
            <>
              <p className="font-semibold text-brand-950">+{formatEur(totalExtra)}</p>
              <p className="text-xs text-neutral-400">{formatEur(price)}/day</p>
            </>
          ) : (
            <p className="font-medium text-neutral-600">Included</p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Pickup place card ─────────────────────────────────────────────────────────

function PlaceCard({
  place,
  selected,
  onSelect,
}: {
  place: OfferPlace;
  selected: boolean;
  onSelect: () => void;
}) {
  const name =
    place.kind === "city"
      ? "City delivery"
      : place.kind === "airport"
        ? place.name || `Airport ${place.iataCode}`
        : place.name || "Office";

  const feeLabel =
    place.deliveryFee != null && place.deliveryFee > 0
      ? `+${formatEur(place.deliveryFee)}`
      : "Free";

  const hours =
    place.opensAt && place.closesAt
      ? `${place.opensAt} – ${place.closesAt}`
      : null;

  const address =
    place.kind === "city"
      ? "You enter the address at checkout"
      : place.address || null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
        selected
          ? "border-brand-700 bg-brand-50"
          : "border-border bg-background hover:border-brand-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected ? "border-brand-700 bg-brand-700" : "border-neutral-300"
            }`}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-white" />}
          </span>
          <div>
            <p className="font-semibold text-brand-950">{name}</p>
            {address && (
              <p className="mt-1 text-sm text-neutral-600">{address}</p>
            )}
            {hours && (
              <p className="mt-0.5 text-xs text-neutral-400">{hours}</p>
            )}
          </div>
        </div>
        <p className="shrink-0 font-medium text-brand-950">{feeLabel}</p>
      </div>
    </button>
  );
}

// ── Extra option row ──────────────────────────────────────────────────────────

function ExtraRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 ring-1 ring-border hover:bg-surface-soft">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-border text-brand-700"
        />
        <span>
          <span className="block text-sm font-medium text-brand-950">{label}</span>
          {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
        </span>
      </span>
    </label>
  );
}

function priceHint(price: CappedPrice): string {
  if (price.perDay != null && price.max != null) return `${formatEur(price.perDay)}/day, max ${formatEur(price.max)}`;
  if (price.perDay != null) return price.perDay > 0 ? `${formatEur(price.perDay)}/day` : "Included";
  if (price.max != null) return price.max > 0 ? `${formatEur(price.max)} for the rental` : "Included";
  return "";
}

// ── Main component ────────────────────────────────────────────────────────────

export function OptionsClient({
  car,
  offer,
  startIso,
  endIso,
  pickupYmd,
  returnYmd,
  pickupTime,
  returnTime,
  citySlug,
  initialSelection,
}: Props) {
  const [selection, setSelection] = useState<OfferSelection>(initialSelection);
  const quote = useMemo(
    () => quoteOffer(car.dailyRate, car.days, offer, { ...selection, pickupTime, returnTime }),
    [car.dailyRate, car.days, offer, selection, pickupTime, returnTime],
  );
  const [extrasOpen, setExtrasOpen] = useState(false);

  function patch(next: Partial<OfferSelection>) {
    setSelection((prev) => ({ ...prev, ...next }));
  }

  const when = `pickup=${pickupYmd}&return=${returnYmd}&pickupTime=${encodeURIComponent(pickupTime)}&returnTime=${encodeURIComponent(returnTime)}`;
  const startEnd = `start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;
  const offerQuery = selectionQuery({ ...selection, pickupTime, returnTime });
  const checkoutHref = `/book/${car.id}/checkout?${startEnd}&${when}&${offerQuery}`;
  const backHref = `/book/${car.id}?${startEnd}&${when}`;

  const pickupPlaces = offer.places.filter((p) => p.pickupAllowed);
  const returnPlaces = offer.oneWayFee == null
    ? offer.places.filter((p) => p.id === selection.pickupPlaceId && p.returnAllowed)
    : offer.places.filter((p) => p.returnAllowed);

  const hasExtras = [
    hasCappedPrice(offer.childSeat),
    hasCappedPrice(offer.additionalDriver),
    hasCappedPrice(offer.gps),
    hasCappedPrice(offer.airportDelivery),
    offer.crossBorderAllowed && hasCappedPrice(offer.crossBorder),
  ].some(Boolean);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1.4fr_1fr] lg:px-8">

      {/* ── Left — options ── */}
      <div className="space-y-10">

        {/* Pickup location */}
        {pickupPlaces.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-brand-950">Where do you pick up?</h2>
            <div className="mt-4 space-y-3">
              {pickupPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  selected={selection.pickupPlaceId === place.id}
                  onSelect={() => patch({
                    pickupPlaceId: place.id,
                    returnPlaceId: offer.oneWayFee == null ? place.id : selection.returnPlaceId,
                  })}
                />
              ))}
            </div>

            {/* Return — only show if one-way is offered */}
            {offer.oneWayFee != null && returnPlaces.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-brand-950">Where do you return?</h3>
                <div className="mt-3 space-y-3">
                  {returnPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      selected={selection.returnPlaceId === place.id}
                      onSelect={() => patch({ returnPlaceId: place.id })}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Insurance */}
        {offer.insurance.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-brand-950">Insurance</h2>
            <div className="mt-4 space-y-3">
              {offer.insurance.map((item) => (
                <InsuranceCard
                  key={item.code}
                  code={item.code}
                  label={item.label}
                  price={item.price}
                  days={car.days}
                  depositBasic={car.depositBasic}
                  selected={selection.insuranceCode === item.code}
                  onSelect={() => patch({ insuranceCode: item.code })}
                />
              ))}
            </div>
          </section>
        )}

        {/* Extras */}
        {hasExtras && (
          <section>
            <button
              type="button"
              onClick={() => setExtrasOpen((o) => !o)}
              className="flex w-full items-center justify-between text-lg font-semibold text-brand-950"
            >
              <span>Additional options</span>
              <span className="text-sm font-normal text-neutral-400">
                {extrasOpen ? "Hide" : "Show"}
              </span>
            </button>
            {extrasOpen && (
              <div className="mt-4 space-y-2">
                {hasCappedPrice(offer.childSeat) && (
                  <>
                    <ExtraRow label="Infant seat (0–1)" hint={priceHint(offer.childSeat)} checked={selection.childSeatInfant} onChange={(v) => patch({ childSeatInfant: v })} />
                    <ExtraRow label="Toddler seat (1–6)" hint={priceHint(offer.childSeat)} checked={selection.childSeatToddler} onChange={(v) => patch({ childSeatToddler: v })} />
                    <ExtraRow label="Child seat (6–12)" hint={priceHint(offer.childSeat)} checked={selection.childSeatChild} onChange={(v) => patch({ childSeatChild: v })} />
                  </>
                )}
                {hasCappedPrice(offer.additionalDriver) && (
                  <ExtraRow label="Additional driver" hint={priceHint(offer.additionalDriver)} checked={selection.additionalDriver} onChange={(v) => patch({ additionalDriver: v })} />
                )}
                {hasCappedPrice(offer.gps) && (
                  <ExtraRow label="GPS" hint={priceHint(offer.gps)} checked={selection.gps} onChange={(v) => patch({ gps: v })} />
                )}
                {hasCappedPrice(offer.airportDelivery) && (
                  <ExtraRow label="Airport delivery" hint={priceHint(offer.airportDelivery)} checked={selection.airportDelivery} onChange={(v) => patch({ airportDelivery: v })} />
                )}
                {offer.crossBorderAllowed && hasCappedPrice(offer.crossBorder) && (
                  <ExtraRow label="Cross-border travel" hint={priceHint(offer.crossBorder)} checked={selection.crossBorder} onChange={(v) => patch({ crossBorder: v })} />
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Right — sticky price + CTA ── */}
      <aside className="h-fit lg:sticky lg:top-20">
        <div className="rounded-2xl bg-background p-6 ring-1 ring-border">
          {/* Compact car summary */}
          <p className="text-sm font-semibold text-brand-950">{carTitle(car)}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {formatDateTimeLabel(pickupYmd, pickupTime)} – {formatDateTimeLabel(returnYmd, returnTime)}
            {" · "}{car.days} {car.days === 1 ? "day" : "days"}
          </p>

          {/* Price breakdown */}
          <dl className="mt-5 space-y-2.5 text-sm">
            {quote.lines.map((line, i) => (
              <div key={line.id} className={`flex justify-between gap-4 ${i === 0 ? "" : "text-neutral-500"}`}>
                <dt>{line.label}</dt>
                <dd className="font-medium text-brand-950">{formatEur(line.amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="font-semibold text-brand-950">Rental at pickup</dt>
              <dd className="text-lg font-semibold text-brand-950">{formatEur(quote.rentalTotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-brand-950">Pay now</dt>
              <dd className="text-lg font-semibold text-brand-900">{formatEur(quote.platformFee)}</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-neutral-400">
            Deposit{" "}
            {selection.insuranceCode === "full"
              ? "not required with full insurance"
              : car.depositBasic != null
                ? `${formatEur(car.depositBasic)} at pickup`
                : "— see rental office"}
          </p>

          <Link
            href={checkoutHref}
            className="mt-5 flex h-12 items-center justify-center rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Continue to payment →
          </Link>

          <Link href={backHref} className="mt-3 block text-center text-sm text-neutral-500 hover:text-brand-900">
            Back to car
          </Link>
        </div>
      </aside>
    </div>
  );
}
