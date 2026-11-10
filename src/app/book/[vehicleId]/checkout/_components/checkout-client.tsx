"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { carTitle, type PublicBookableCar } from "@/lib/booking/public-types";
import { formatEur } from "@/lib/booking/money";
import { formatDateTimeLabel } from "@/lib/booking/dates";
import type { AddressHit } from "@/lib/booking/address";
import { quoteOffer, selectionQuery, type OfferSelection, type PublicOffer } from "@/lib/booking/offer";
import { getCityBySlug } from "@/lib/cities";
import { AddressSearch } from "@/components/booking/address-search";

type Props = {
  car: PublicBookableCar;
  startIso: string;
  endIso: string;
  pickupYmd: string;
  returnYmd: string;
  pickupTime: string;
  returnTime: string;
  selection: OfferSelection;
  offer: PublicOffer | null;
  citySlug: string;
};

export function CheckoutClient({
  car,
  startIso,
  endIso,
  pickupYmd,
  returnYmd,
  pickupTime,
  returnTime,
  selection,
  offer,
  citySlug,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [driverAge, setDriverAge] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<AddressHit | null>(null);
  const [collectionAddress, setCollectionAddress] = useState<AddressHit | null>(null);
  const [sameAddress, setSameAddress] = useState(true);
  const age = driverAge.trim() === "" ? null : Number(driverAge);
  const city = getCityBySlug(citySlug);
  const pickupPlace = offer?.places.find((place) => place.id === selection.pickupPlaceId) ?? null;
  const returnPlace = offer?.places.find((place) => place.id === selection.returnPlaceId) ?? pickupPlace;
  const needsDeliveryAddress = pickupPlace?.kind === "city";
  const needsCollectionAddress = returnPlace?.kind === "city";
  const collectionReady = !needsCollectionAddress || (needsDeliveryAddress && sameAddress ? deliveryAddress != null : collectionAddress != null);
  const addressMissing = (needsDeliveryAddress && !deliveryAddress) || !collectionReady;
  const quote = useMemo(
    () => quoteOffer(car.dailyRate, car.days, offer, { ...selection, driverAge: Number.isFinite(age) ? age : null }),
    [car.dailyRate, car.days, offer, selection, age],
  );
  const tooYoung = offer != null && age != null && Number.isFinite(age) && age < offer.minDriverAge;
  const when = `pickup=${pickupYmd}&return=${returnYmd}&pickupTime=${encodeURIComponent(pickupTime)}&returnTime=${encodeURIComponent(returnTime)}`;
  const backHref = `/book/${car.id}?${when}&${selectionQuery(selection)}`;
  const payBlocked = addressMissing || tooYoung || saving;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (addressMissing || tooYoung || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: car.id,
          start: startIso,
          end: endIso,
          name,
          email,
          phone,
          driverAge: age,
          flightNumber,
          customerRequest: notes,
          deliveryLabel: deliveryAddress?.label ?? "",
          collectionLabel: (sameAddress ? deliveryAddress?.label : collectionAddress?.label) ?? "",
          sameAddress,
          selection: { ...selection, driverAge: Number.isFinite(age) ? age : null },
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error || "The card page could not be opened.");
        setSaving(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("The card page could not be opened.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Checkout</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-brand-950">
          Confirm {carTitle(car)}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {formatDateTimeLabel(pickupYmd, pickupTime)} – {formatDateTimeLabel(returnYmd, returnTime)} · {car.days} {car.days === 1 ? "day" : "days"} · {car.companyName}
        </p>

        <form id="checkout-form" className="mt-8 space-y-4" onSubmit={pay}>
          <Field label="Full name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inp}
              autoComplete="name"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inp}
              autoComplete="email"
            />
          </Field>
          <Field label="Phone">
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inp}
              autoComplete="tel"
            />
          </Field>
          <Field label={offer ? `Driver age (minimum ${offer.minDriverAge})` : "Driver age"}>
            <input
              required
              type="number"
              min={offer?.minDriverAge ?? 18}
              max={99}
              value={driverAge}
              onChange={(e) => setDriverAge(e.target.value)}
              className={inp}
            />
          </Field>
          <Field label="Flight number">
            <input
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              className={inp}
              placeholder="If you land at the airport"
            />
          </Field>
          {needsDeliveryAddress && city && (
            <AddressSearch
              citySlug={city.slug}
              cityName={city.name}
              label="Delivery address or hotel"
              onSelect={setDeliveryAddress}
            />
          )}
          {needsCollectionAddress && city && (
            <div className="space-y-3">
              {needsDeliveryAddress && (
                <label className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => setSameAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Collect the car from the same place
                </label>
              )}
              {(!needsDeliveryAddress || !sameAddress) && (
                <AddressSearch
                  citySlug={city.slug}
                  cityName={city.name}
                  label="Collection address or hotel"
                  onSelect={setCollectionAddress}
                />
              )}
            </div>
          )}
          <Field label="Special requests or information">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inp}
              placeholder="Anything the rental should know"
            />
          </Field>
          {addressMissing && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Choose the address from the list. It has to be inside {city?.name ?? "the city"}.
            </p>
          )}
          {tooYoung && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This company rents to drivers aged {offer?.minDriverAge} and over.
            </p>
          )}
          <p className="text-xs leading-5 text-neutral-500">
            No account needed. We use these details for the booking confirmation and so the office can reach you.
          </p>
        </form>
      </div>

      <aside className="h-fit rounded-2xl bg-background p-6 ring-1 ring-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Pay now vs pickup</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-600">Car rental</dt>
            <dd className="font-medium text-brand-950">{formatEur(car.rentalTotal)}</dd>
          </div>
          {quote.lines.slice(1).map((line) => (
            <div key={line.id} className="flex justify-between gap-4">
              <dt className="text-neutral-600">{line.label}</dt>
              <dd className="font-medium text-brand-950">{formatEur(line.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-border pt-3">
            <dt className="font-medium text-brand-950">Pay at pickup</dt>
            <dd className="text-lg font-semibold text-brand-950">{formatEur(quote.rentalTotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-brand-950">Pay now (card)</dt>
            <dd className="text-lg font-semibold text-brand-900">{formatEur(quote.platformFee)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-neutral-500">
          Pay {formatEur(quote.platformFee)} now to confirm. Pay the rental ({formatEur(quote.rentalTotal)}) to {car.companyName} when you pick up the car. This is not a deposit against the rental.
        </p>
        <button
          type="button"
          disabled={payBlocked}
          onClick={(e) => {
            void pay(e);
          }}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Opening the card page…" : `Pay ${formatEur(quote.platformFee)} now`}
        </button>
        <p className={`mt-3 text-center text-xs leading-5 ${error ? "text-red-700" : "text-neutral-500"}`}>
          {error
            ? error
            : addressMissing
              ? "The address is required before payment."
              : tooYoung
                ? `Drivers must be ${offer?.minDriverAge} or over.`
                : "You pay only this confirmation fee by card. The rental is paid at pickup."}
        </p>
        <Link href={backHref} className="mt-4 block text-center text-sm text-neutral-500 hover:text-brand-900">
          Back to car
        </Link>
        <Link
          href={`/${citySlug}?${when}`}
          className="mt-1 block text-center text-sm text-neutral-500 hover:text-brand-900"
        >
          All {getCityBySlug(citySlug)?.name ?? citySlug} cars
        </Link>
      </aside>
    </div>
  );
}

const inp =
  "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-brand-950 outline-none focus:ring-2 focus:ring-brand-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
