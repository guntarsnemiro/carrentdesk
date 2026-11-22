import { NextResponse } from "next/server";
import { cancelOnlineBooking, type CancelReason } from "@/lib/booking/cancel-online";
import { FeeRefundError } from "@/lib/booking/payment";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isCancelReason(value: unknown): value is CancelReason {
  return value === "unavailable" || value === "customer" || value === "operator";
}

/**
 * POST /api/booking/cancel
 * Office only. A rental cancellation refunds the confirmation fee.
 * A customer cancellation keeps it. The rental is never charged here.
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
    .select("id")
    .eq("id", bookingId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) {
    console.error("[booking/cancel]", error);
    return NextResponse.json({ error: "Could not load the booking." }, { status: 500 });
  }
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  try {
    const result = await cancelOnlineBooking(booking.id, reason);
    return NextResponse.json({ ok: true, refunded: result.refunded });
  } catch (err) {
    const message = err instanceof FeeRefundError
      ? err.message
      : err instanceof Error
        ? err.message
        : "Could not cancel the booking.";
    const status = err instanceof FeeRefundError ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
