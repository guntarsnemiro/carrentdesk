import type { Metadata } from "next";
import Link from "next/link";
import { applyPaidSession } from "@/lib/booking/payment";
import { formatEur } from "@/lib/booking/money";
import { MONTHS, isoToTime, isoToYmd, parseYmd } from "@/lib/booking/dates";
import { carTitle } from "@/lib/booking/public-types";
import { getCityBySlug } from "@/lib/cities";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking confirmation",
  robots: { index: false, follow: false },
};

type Search = { session_id?: string };

function when(iso: string): string {
  const ymd = isoToYmd(iso);
  const time = isoToTime(iso);
  const dt = parseYmd(ymd);
  if (!dt) return `${ymd} ${time}`;
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}, ${time}`;
}

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return (
      <Shell title="Payment not found">
        <p>This page opens after the card payment. If you closed it early, check your email for a Stripe receipt.</p>
      </Shell>
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return (
      <Shell title="Payment received">
        <p>The card page is not connected yet, so this booking cannot be confirmed from here.</p>
      </Shell>
    );
  }

  let paid = false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    paid = session.payment_status === "paid";
    await applyPaidSession({
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    });
  } catch (err) {
    console.error("[book/confirmed]", err instanceof Error ? err.message : err);
    return (
      <Shell title="Payment not found">
        <p>This payment link is not valid. If money left your card, the receipt from Stripe has the reference.</p>
      </Shell>
    );
  }

  const db = createServiceRoleClient();
  const { data: booking } = await db
    .from("bookings")
    .select("id, status, start_at, end_at, rental_total, platform_fee, pickup_location, return_location, company_id, vehicle_id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!booking) {
    return (
      <Shell title={paid ? "Payment received" : "Payment not finished"}>
        <p>
          {paid
            ? "Stripe has the payment. The booking record is not on this page yet — check the office rentals list."
            : "The card payment was not finished, so the booking was not confirmed."}
        </p>
      </Shell>
    );
  }

  const [{ data: company }, { data: vehicle }] = await Promise.all([
    db.from("companies").select("name, slug, city").eq("id", booking.company_id).maybeSingle(),
    db.from("vehicles").select("make, model").eq("id", booking.vehicle_id).maybeSingle(),
  ]);

  const confirmed = booking.status === "confirmed" || booking.status === "active" || booking.status === "returned";
  const cityName = company ? (getCityBySlug(company.city)?.name ?? company.city) : "";
  const title = vehicle ? carTitle({ make: vehicle.make, model: vehicle.model }) : "Your car";

  if (!confirmed) {
    return (
      <Shell title={paid ? "Payment received" : "Payment not finished"}>
        <p>
          {paid
            ? "Stripe has the payment. We are checking it before the booking is confirmed. The rental company can see the hold."
            : "The card payment was not finished. The car is held only for a short time, then it goes back on sale."}
        </p>
        {company && (
          <p className="mt-6">
            <Link href={`/${company.city}`} className="text-brand-700 hover:underline">
              All {cityName} cars
            </Link>
          </p>
        )}
      </Shell>
    );
  }

  return (
    <Shell title="Booking confirmed">
      <p>
        {title} is booked{company ? ` with ${company.name}` : ""}. Pay the rental when you pick up the car.
        This card payment was the confirmation fee only.
      </p>
      <dl className="mt-8 space-y-3 text-sm">
        <Row label="Pickup" value={when(booking.start_at)} />
        <Row label="Return" value={when(booking.end_at)} />
        {booking.pickup_location && <Row label="Pickup place" value={booking.pickup_location} />}
        {booking.return_location && <Row label="Return place" value={booking.return_location} />}
        <Row label="Paid now" value={formatEur(Number(booking.platform_fee ?? 0))} />
        <Row label="Pay at pickup" value={formatEur(Number(booking.rental_total ?? 0))} />
      </dl>
      {company && (
        <p className="mt-8 text-sm">
          <Link href={`/c/${company.slug}`} className="text-brand-700 hover:underline">
            {company.name}
          </Link>
          <span className="mx-2 text-neutral-300">·</span>
          <Link href={`/${company.city}`} className="text-brand-700 hover:underline">
            All {cityName} cars
          </Link>
        </p>
      )}
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">CarRentDesk</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-950">{title}</h1>
      <div className="mt-4 text-sm leading-6 text-neutral-700">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border pb-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium text-brand-950">{value}</dd>
    </div>
  );
}
