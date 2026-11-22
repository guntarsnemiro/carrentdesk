import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { roundMoney } from "@/lib/booking/platform-fee";
import { notifyBookingConfirmed } from "@/lib/booking/notices";
import { getStripe } from "@/lib/stripe";

export type PaidSession = {
  id: string;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  metadata: { booking_id?: string } | null;
};

export type PaymentApplyResult = "confirmed" | "already" | "unpaid" | "missing" | "mismatch";

function feeCents(amount: number): number {
  return Math.round(roundMoney(amount) * 100);
}

/**
 * Confirm a pending booking after Stripe reports the confirmation fee as paid.
 * The rental total is not charged here. Safe to call from the webhook and the
 * return page: a second call does not change a booking that is already confirmed.
 */
export async function applyPaidSession(session: PaidSession): Promise<PaymentApplyResult> {
  if (session.payment_status !== "paid") return "unpaid";
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return "missing";

  const db = createServiceRoleClient();
  const { data: booking, error } = await db
    .from("bookings")
    .select("id, status, stripe_session_id, platform_fee")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!booking) return "missing";
  if (booking.stripe_session_id && booking.stripe_session_id !== session.id) return "mismatch";

  const expected = feeCents(Number(booking.platform_fee ?? 0));
  const paid = session.amount_total;
  if (session.currency !== "eur" || paid == null || paid !== expected) return "mismatch";

  if (booking.status === "confirmed" || booking.status === "active" || booking.status === "returned") {
    if (booking.status === "confirmed") await notifyBookingConfirmed(booking.id);
    return "already";
  }
  if (booking.status !== "pending_payment") return "mismatch";

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from("bookings")
    .update({
      status: "confirmed",
      fee_paid_at: now,
      pending_expires_at: null,
      stripe_session_id: session.id,
      updated_at: now,
    })
    .eq("id", bookingId)
    .eq("status", "pending_payment")
    .select("id");
  if (updateError) throw updateError;
  if (updated && updated.length > 0) {
    await notifyBookingConfirmed(bookingId);
    return "confirmed";
  }
  await notifyBookingConfirmed(bookingId);
  return "already";
}

export class FeeRefundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeeRefundError";
  }
}

/**
 * Refund the whole confirmation fee. The rental was never charged.
 * Returns "unpaid" when there is no card payment to return.
 */
export async function refundPaidConfirmationFee(bookingId: string): Promise<"refunded" | "already" | "unpaid"> {
  const db = createServiceRoleClient();
  const { data: booking, error } = await db
    .from("bookings")
    .select("id, platform_fee, fee_paid_at, fee_refunded_at, stripe_session_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!booking) throw new FeeRefundError("Booking not found.");
  if (booking.fee_refunded_at) return "already";
  if (!booking.fee_paid_at || !booking.stripe_session_id || booking.platform_fee == null) return "unpaid";

  const stripe = getStripe();
  if (!stripe) throw new FeeRefundError("Card refunds are not switched on. The Stripe secret key is missing.");

  const expected = feeCents(Number(booking.platform_fee));
  const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
  if (session.currency !== "eur" || session.amount_total !== expected || !paymentIntentId) {
    throw new FeeRefundError("The card charge does not match the confirmation fee, so it was not refunded.");
  }

  try {
    const refund = await stripe.refunds.create(
      { payment_intent: paymentIntentId, amount: expected },
      { idempotencyKey: `confirmation-fee-${bookingId}` },
    );
    if (refund.status === "failed" || refund.status === "canceled") {
      throw new FeeRefundError("Stripe did not refund the confirmation fee.");
    }
  } catch (err) {
    if (err instanceof FeeRefundError) throw err;
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code !== "charge_already_refunded") {
      console.error("[fee refund]", err);
      throw new FeeRefundError("Stripe could not refund the confirmation fee.");
    }
  }

  const now = new Date().toISOString();
  const { error: updateError } = await db
    .from("bookings")
    .update({ fee_refunded_at: now, updated_at: now })
    .eq("id", bookingId);
  if (updateError) throw updateError;
  return "refunded";
}

/** Drop an unpaid hold so the car is free. Leaves a confirmed booking alone. */
export async function releaseUnpaidHold(bookingId: string): Promise<void> {
  const db = createServiceRoleClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from("bookings")
    .update({ status: "cancelled", pending_expires_at: null, updated_at: now })
    .eq("id", bookingId)
    .eq("status", "pending_payment");
  if (error) throw error;
}
