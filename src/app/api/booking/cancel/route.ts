import { NextResponse } from "next/server";
import { FeeRefundError, refundPaidConfirmationFee } from "@/lib/booking/payment";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CancelReason = "unavailable" | "customer" | "operator";

function isCancelReason(value: unknown): value is CancelReason {
  return value === "unavailable" || value === "customer" || value === "operator";
}

/**
 * POST /api/booking/cancel
 * Office only. "unavailable" refunds the whole confirmation fee.
 * Customer and office cancels keep the fee. The rental is never charged here.
 */
export async function POST(request: Request) {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to cancel a booking." }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the cancellation as JSON." }, { status: 400 });
  }
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Send the cancellation as JSON." }, { status: 400 });
  }
  const body = raw as Record<string, unknown>;
  const companyId = typeof body.companyId === "string" ? body.companyId : "";
  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
  const reason = body.reason;
  if (!companyId || !bookingId || !isCancelReason(reason)) {
    return NextResponse.json({ error: "Choose why the booking is being cancelled." }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "You cannot cancel this booking." }, { status: 403 });

  const { data: booking, error } = await db
    .from("bookings")
    .select("id, status, company_id, fee_paid_at, fee_refunded_at")
    .eq("id", bookingId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) {
    console.error("[booking/cancel]", error);
    return NextResponse.json({ error: "Could not load the booking." }, { status: 500 });
  }
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  let refunded = Boolean(booking.fee_refunded_at);
  if (reason === "unavailable" && booking.fee_paid_at && !booking.fee_refunded_at) {
    try {
      const result = await refundPaidConfirmationFee(booking.id);
      refunded = result === "refunded" || result === "already";
    } catch (err) {
      const message = err instanceof FeeRefundError ? err.message : "Stripe could not refund the confirmation fee.";
      return NextResponse.json({ error: message }, { status: 502 });
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
      .eq("id", booking.id)
      .eq("company_id", companyId);
    if (updateError) {
      console.error("[booking/cancel]", updateError);
      return NextResponse.json({ error: "The fee was handled, but the booking could not be cancelled." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, refunded });
}
