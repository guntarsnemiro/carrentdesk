import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./_components/checkout-client";
import { BookingSearchError, getPublicCar } from "@/lib/booking/search";
import { getCityBySlug } from "@/lib/cities";
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
  title: "Confirm booking",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ params, searchParams }: PageProps) {
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

  const city = getCityBySlug(detail.city);
  const citySlug = detail.city;
  const cityName = city?.name ?? detail.city;

  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 lg:px-8">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-900">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <Link href={`/${citySlug}`} className="hover:text-brand-900">{cityName}</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-neutral-700">Checkout</span>
          </nav>
        </div>
      </section>
      <CheckoutClient
        car={detail.car}
        startIso={detail.start}
        endIso={detail.end}
        pickupYmd={pickupYmd}
        returnYmd={returnYmd}
        pickupTime={pickupTime}
        returnTime={returnTime}
        offer={detail.offer}
        selection={selectionFromParams(detail.offer, pickupTime, returnTime, {
          insurance: first(sp.insurance),
          pickupPlace: first(sp.pickupPlace),
          returnPlace: first(sp.returnPlace),
          seats: first(sp.seats),
          extras: first(sp.extras),
          crossBorder: first(sp.crossBorder),
        })}
        citySlug={citySlug}
      />
    </>
  );
}
