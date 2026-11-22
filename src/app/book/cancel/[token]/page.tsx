import type { Metadata } from "next";
import Link from "next/link";
import { MONTHS, isoToTime, isoToYmd, parseYmd } from "@/lib/booking/dates";
import { formatEur } from "@/lib/booking/money";
import { carTitle } from "@/lib/booking/public-types";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { cancelByCustomerToken } from "./_actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cancel booking",
  robots: { index: false, follow: false },
};

function when(iso: string): string {
  const ymd = isoToYmd(iso);
  const time = isoToTime(iso);
  const dt = parseYmd(ymd);
  if (!dt) return `${ymd} ${time}`;
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}, ${time}`;
}

export default async function CancelBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = /^[A-Za-z0-9_-]{20,80}$/.test(token);
  const db = createServiceRoleClient();
  const { data: booking } = valid
    ? await db
        .from("bookings")
        .select("id, status, source, start_at, end_at, company_id, vehicle_id, platform_fee, fee_paid_at, fee_refunded_at")
        .eq("customer_cancel_token", token)
        .eq("source", "online")
        .maybeSingle()
    : { data: null };

  if (!booking) {
    return (
      <Shell title="Cancel link not valid">
        <p>This link does not match a booking. If you need to cancel, use the link in the confirmation email.</p>
      </Shell>
    );
  }

  const [{ data: company }, { data: vehicle }] = await Promise.all([
    db.from("companies").select("name, phone, city, slug").eq("id", booking.company_id).maybeSingle(),
    db.from("vehicles").select("make, model").eq("id", booking.vehicle_id).maybeSingle(),
  ]);
  const title = vehicle ? carTitle(vehicle) : "Your car";
  const fee = Number(booking.platform_fee ?? 0);
  const paid = Boolean(booking.fee_paid_at);
  const refunded = Boolean(booking.fee_refunded_at);
  const canCancel = booking.status === "confirmed" || booking.status === "pending_payment";

  return (
    <Shell title={booking.status === "cancelled" ? "Booking cancelled" : "Cancel booking"}>
      <p>
        {`${title}${company ? ` with ${company.name}` : ""}. Pickup ${when(booking.start_at)}. Return ${when(booking.end_at)}.`}
      </p>
      {booking.status === "cancelled" && refunded && (
        <p className="mt-4">The confirmation fee of {formatEur(fee)} is refunded to your card.</p>
      )}
      {booking.status === "cancelled" && !refunded && paid && (
        <p className="mt-4">This booking is cancelled. The confirmation fee of {formatEur(fee)} is not returned.</p>
      )}
      {booking.status === "cancelled" && !paid && (
        <p className="mt-4">This booking is cancelled. The card payment was not taken.</p>
      )}
      {!canCancel && booking.status !== "cancelled" && (
        <p className="mt-4">
          This booking has already started. Call {company?.name ?? "the rental"}
          {company?.phone ? ` on ${company.phone}` : ""} to change it.
        </p>
      )}
      {canCancel && paid && !refunded && (
        <p className="mt-4">
          Cancelling keeps the confirmation fee of {formatEur(fee)}. It is not returned to your card.
        </p>
      )}
      {canCancel && (
        <form action={cancelByCustomerToken} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Cancel booking
          </button>
        </form>
      )}
      {company && (
        <p className="mt-8">
          <Link href={`/c/${company.slug}`} className="text-brand-700 hover:underline">{company.name}</Link>
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
