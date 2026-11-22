import "server-only";
import { FeeRefundError, refundPaidConfirmationFee } from "@/lib/booking/payment";
import { notifyBookingCancelled } from "@/lib/booking/notices";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type CancelReason = "unavailable" | "customer" | "operator";

/** A cancellation made by the rental refunds the confirmation fee. A customer cancellation keeps it. */
export function rentalRefundsFee(reason: CancelReason): boolean {
  return reason === "unavailable" || reason === "operator";
}

/**
 * Cancel one online or office booking. Rental reasons refund a paid confirmation
 * fee before the booking is marked cancelled. Customer cancellations keep the fee.
 */
export async function cancelOnlineBooking(bookingId: string, reason: CancelReason): Promise<{ refunded: boolean }> {
  const db = createServiceRoleClient();
  const { data: booking, error } = await db
    .from("bookings")
    .select("id, status, fee_paid_at, fee_refunded_at")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!booking) throw new Error("Booking not found.");

  let refunded = Boolean(booking.fee_refunded_at);
  if (rentalRefundsFee(reason) && booking.fee_paid_at && !booking.fee_refunded_at) {
    try {
      const result = await refundPaidConfirmationFee(booking.id);
      refunded = result === "refunded" || result === "already";
    } catch (err) {
      if (err instanceof FeeRefundError) throw err;
      throw new FeeRefundError("Stripe could not refund the confirmation fee.");
    }
  }

  if (booking.status !== "cancelled") {
    const now = new Date().toISOString();
    const { error: updateError } = await db
      .from("bookings")
      .update({
        status: "cancelled",
        cancel_reason: reason,
        pending_expires_at: null,
        updated_at: now,
      })
      .eq("id", booking.id);
    if (updateError) throw updateError;
  }

  await notifyBookingCancelled(booking.id);
  return { refunded };
}
