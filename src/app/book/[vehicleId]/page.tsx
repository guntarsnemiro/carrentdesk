import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarBookingClient } from "./_components/car-booking-client";
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

function resolveRange(sp: Record<string, string | string[] | undefined>) {
  const startIso = first(sp.start);
  const endIso = first(sp.end);
  const pickupTime = first(sp.pickupTime) || (startIso ? isoToTime(startIso) : DEFAULT_PICKUP_TIME);
  const returnTime = first(sp.returnTime) || (endIso ? isoToTime(endIso) : DEFAULT_RETURN_TIME);
  if (startIso && endIso) {
    return {
      start: startIso,
      end: endIso,
      pickupYmd: first(sp.pickup) || isoToYmd(startIso),
      returnYmd: first(sp.return) || isoToYmd(endIso),
      pickupTime,
      returnTime,
    };
  }
  const pickupYmd = first(sp.pickup) || defaultPickupYmd();
  const returnYmd = first(sp.return) || defaultReturnYmd(pickupYmd);
  return {
    start: ymdToIso(pickupYmd, pickupTime),
    end: ymdToIso(returnYmd, returnTime),
    pickupYmd,
    returnYmd,
    pickupTime,
    returnTime,
  };
}

export const metadata: Metadata = {
  title: "Book a car",
  robots: { index: false, follow: false },
};

export default async function BookCarPage({ params, searchParams }: PageProps) {
  const { vehicleId } = await params;
  const sp = await searchParams;
  const range = resolveRange(sp);

  let detail;
  try {
    detail = await getPublicCar({
      vehicleId,
      start: range.start,
      end: range.end,
    });
  } catch (err) {
    if (err instanceof BookingSearchError && err.status === 404) notFound();
    throw err;
  }

  const city = getCityBySlug(detail.city);
  const citySlug = detail.city;
  const cityName = city?.name ?? detail.city;

  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-8">
          <nav className="text-xs text-neutral-500">
            <Link href="/" className="hover:text-brand-900">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <Link href={`/${citySlug}`} className="hover:text-brand-900">{cityName}</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-neutral-700">{carTitle(detail.car)}</span>
          </nav>
        </div>
      </section>
      <CarBookingClient
        car={detail.car}
        startIso={detail.start}
        endIso={detail.end}
        pickupYmd={range.pickupYmd}
        returnYmd={range.returnYmd}
        pickupTime={range.pickupTime}
        returnTime={range.returnTime}
        citySlug={citySlug}
        offer={detail.offer}
        initialSelection={selectionFromParams(detail.offer, range.pickupTime, range.returnTime, {
          insurance: first(sp.insurance),
          pickupPlace: first(sp.pickupPlace),
          returnPlace: first(sp.returnPlace),
          seats: first(sp.seats),
          extras: first(sp.extras),
          crossBorder: first(sp.crossBorder),
        })}
      />
    </>
  );
}
