import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OptionsClient } from "./_components/options-client";
import { BookingSearchError, getPublicCar } from "@/lib/booking/search";
import { getCityBySlug } from "@/lib/cities";
import { carTitle } from "@/lib/booking/public-types";
import {
  defaultPickupYmd,
  defaultReturnYmd,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  isoToTime,
  isoToYmd,
  ymdToIso,
} from "@/lib/booking/dates";
import { selectionFromParams } from "@/lib/booking/offer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export const metadata: Metadata = {
  title: "Choose your options",
  robots: { index: false, follow: false },
};

export default async function OptionsPage({ params, searchParams }: PageProps) {
  const { vehicleId } = await params;
  const sp = await searchParams;

  const startIso = first(sp.start);
  const endIso = first(sp.end);
  const pickupYmd = first(sp.pickup) || (startIso ? isoToYmd(startIso) : defaultPickupYmd());
  const returnYmd = first(sp.return) || (endIso ? isoToYmd(endIso) : defaultReturnYmd(pickupYmd));
  const pickupTime = first(sp.pickupTime) || (startIso ? isoToTime(startIso) : DEFAULT_PICKUP_TIME);
  const returnTime = first(sp.returnTime) || (endIso ? isoToTime(endIso) : DEFAULT_RETURN_TIME);
  const start = startIso || ymdToIso(pickupYmd, pickupTime);
  const end = endIso || ymdToIso(returnYmd, returnTime);

  let detail;
  try {
    detail = await getPublicCar({ vehicleId, start, end });
  } catch (err) {
    if (err instanceof BookingSearchError && err.status === 404) notFound();
    throw err;
  }

  if (!detail.car.available) notFound();

  // If no offer → skip straight to checkout
  if (!detail.offer) {
    const when = `pickup=${pickupYmd}&return=${returnYmd}&pickupTime=${encodeURIComponent(pickupTime)}&returnTime=${encodeURIComponent(returnTime)}`;
    redirect(`/book/${vehicleId}/checkout?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&${when}`);
  }

  const city = getCityBySlug(detail.city);
  const citySlug = detail.city;
  const cityName = city?.name ?? detail.city;

  const initialSelection = selectionFromParams(detail.offer, pickupTime, returnTime, {
    insurance: first(sp.insurance),
    pickupPlace: first(sp.pickupPlace),
    returnPlace: first(sp.returnPlace),
    seats: first(sp.seats),
    extras: first(sp.extras),
    crossBorder: first(sp.crossBorder),
  });

  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 lg:px-8">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-900">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <Link href={`/${citySlug}`} className="hover:text-brand-900">{cityName}</Link>
            <span aria-hidden className="mx-2">/</span>
            <Link
              href={`/book/${vehicleId}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&pickup=${pickupYmd}&return=${returnYmd}&pickupTime=${encodeURIComponent(pickupTime)}&returnTime=${encodeURIComponent(returnTime)}`}
              className="hover:text-brand-900"
            >
              {carTitle(detail.car)}
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-neutral-700">Options</span>
          </nav>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Step 2 of 3
          </p>
          <h1 className="mt-1 text-xl font-semibold text-brand-950">Choose your options</h1>
        </div>
      </section>

      <OptionsClient
        car={detail.car}
        offer={detail.offer}
        startIso={detail.start}
        endIso={detail.end}
        pickupYmd={pickupYmd}
        returnYmd={returnYmd}
        pickupTime={pickupTime}
        returnTime={returnTime}
        citySlug={citySlug}
        initialSelection={initialSelection}
      />
    </>
  );
}
