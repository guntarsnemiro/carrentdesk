import "server-only";
import { randomBytes } from "node:crypto";
import { MONTHS, isoToTime, isoToYmd, parseYmd } from "@/lib/booking/dates";
import { carTitle } from "@/lib/booking/public-types";
import {
  customerCancelledCopy,
  customerConfirmedCopy,
  rentalCancelledCopy,
  rentalConfirmedCopy,
  type BookingNotice,
} from "@/lib/booking/notice-copy";
import { sendBookingNotice } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server";

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "info@carrentdesk.com";

type LoadedNotice = {
  notice: BookingNotice;
  companyId: string;
  companyEmail: string | null;
};

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com").replace(/\/$/, "");
}

function when(iso: string): string {
  const ymd = isoToYmd(iso);
  const time = isoToTime(iso);
  const dt = parseYmd(ymd);
  if (!dt) return `${ymd} ${time}`;
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}, ${time}`;
}

function keepEmail(value: string | null | undefined, into: Set<string>) {
  const email = value?.trim().toLowerCase() ?? "";
  if (email.includes("@")) into.add(email);
}

async function rentalRecipients(companyId: string, companyEmail: string | null): Promise<string[]> {
  const db = createServiceRoleClient();
  const addresses = new Set<string>();
  keepEmail(companyEmail, addresses);
  const { data: members } = await db.from("company_members").select("user_id").eq("company_id", companyId);
  for (const member of members ?? []) {
    const { data } = await db.auth.admin.getUserById(member.user_id);
    keepEmail(data.user?.email, addresses);
  }
  if (addresses.size === 0) keepEmail(OWNER_EMAIL, addresses);
  return [...addresses];
}

async function loadNotice(bookingId: string): Promise<LoadedNotice | null> {
  const db = createServiceRoleClient();
  const { data: booking, error } = await db
    .from("bookings")
    .select("id, company_id, vehicle_id, customer_id, start_at, end_at, pickup_location, return_location, flight_number, customer_request, rental_total, deposit_amount, platform_fee, cancel_reason, customer_cancel_token")
    .eq("id", bookingId)
    .eq("source", "online")
    .maybeSingle();
  if (error) throw error;
  if (!booking?.customer_id) return null;

  const [{ data: company }, { data: vehicle }, { data: customer }] = await Promise.all([
    db.from("companies").select("name, phone, email").eq("id", booking.company_id).maybeSingle(),
    db.from("vehicles").select("make, model, year, plate").eq("id", booking.vehicle_id).maybeSingle(),
    db.from("customers").select("full_name, email, phone").eq("id", booking.customer_id).maybeSingle(),
  ]);
  if (!company || !customer) return null;

  let token = booking.customer_cancel_token;
  if (!token) {
    token = randomBytes(24).toString("base64url");
    const { error: tokenError } = await db
      .from("bookings")
      .update({ customer_cancel_token: token })
      .eq("id", booking.id)
      .is("customer_cancel_token", null);
    if (tokenError) throw tokenError;
  }

  const origin = siteOrigin();
  return {
    companyId: booking.company_id,
    companyEmail: company.email,
    notice: {
      customerName: customer.full_name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      companyName: company.name,
      companyPhone: company.phone,
      carPublic: vehicle ? carTitle(vehicle) : "Your car",
      carOffice: vehicle ? `${vehicle.make} ${vehicle.model}${vehicle.year ? ` ${vehicle.year}` : ""}` : "Car",
      plate: vehicle?.plate ?? null,
      pickup: when(booking.start_at),
      returnAt: when(booking.end_at),
      pickupPlace: booking.pickup_location,
      returnPlace: booking.return_location,
      flight: booking.flight_number,
      request: booking.customer_request,
      rentalTotal: Number(booking.rental_total ?? 0),
      deposit: booking.deposit_amount == null ? null : Number(booking.deposit_amount),
      fee: Number(booking.platform_fee ?? 0),
      cancelUrl: `${origin}/book/cancel/${token}`,
      officeUrl: `${origin}/app/rentals/${booking.company_id}/${booking.id}`,
      customerCancelled: booking.cancel_reason === "customer",
    },
  };
}

async function sendPair(
  loaded: LoadedNotice,
  customerLetter: { subject: string; text: string },
  rentalLetter: { subject: string; text: string },
): Promise<boolean> {
  const rentalTo = await rentalRecipients(loaded.companyId, loaded.companyEmail);
  let customerOk = true;
  if (loaded.notice.customerEmail) {
    customerOk = await sendBookingNotice({
      to: [loaded.notice.customerEmail],
      replyTo: loaded.companyEmail,
      subject: customerLetter.subject,
      text: customerLetter.text,
    });
  }
  const rentalOk = await sendBookingNotice({
    to: rentalTo,
    replyTo: loaded.notice.customerEmail,
    subject: rentalLetter.subject,
    text: rentalLetter.text,
  });
  return customerOk && rentalOk;
}

/** Email the customer and the rental once, after the confirmation fee is paid. */
export async function notifyBookingConfirmed(bookingId: string): Promise<void> {
  const db = createServiceRoleClient();
  try {
    const { data: claimed, error } = await db
      .from("bookings")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", bookingId)
      .eq("source", "online")
      .eq("status", "confirmed")
      .not("fee_paid_at", "is", null)
      .is("confirmation_sent_at", null)
      .select("id");
    if (error) throw error;
    if (!claimed?.length) return;

    const loaded = await loadNotice(bookingId);
    const sent = loaded
      ? await sendPair(loaded, customerConfirmedCopy(loaded.notice), rentalConfirmedCopy(loaded.notice))
      : false;
    if (!sent) {
      await db.from("bookings").update({ confirmation_sent_at: null }).eq("id", bookingId);
    }
  } catch (err) {
    console.error("[booking notice] confirmed", err);
    await db.from("bookings").update({ confirmation_sent_at: null }).eq("id", bookingId);
  }
}

/** Email both sides once after a paid online booking is cancelled. */
export async function notifyBookingCancelled(bookingId: string): Promise<void> {
  const db = createServiceRoleClient();
  try {
    const { data: claimed, error } = await db
      .from("bookings")
      .update({ cancel_notice_sent_at: new Date().toISOString() })
      .eq("id", bookingId)
      .eq("source", "online")
      .eq("status", "cancelled")
      .not("fee_paid_at", "is", null)
      .is("cancel_notice_sent_at", null)
      .select("id");
    if (error) throw error;
    if (!claimed?.length) return;

    const loaded = await loadNotice(bookingId);
    const sent = loaded
      ? await sendPair(loaded, customerCancelledCopy(loaded.notice), rentalCancelledCopy(loaded.notice))
      : false;
    if (!sent) {
      await db.from("bookings").update({ cancel_notice_sent_at: null }).eq("id", bookingId);
    }
  } catch (err) {
    console.error("[booking notice] cancelled", err);
    await db.from("bookings").update({ cancel_notice_sent_at: null }).eq("id", bookingId);
  }
}
