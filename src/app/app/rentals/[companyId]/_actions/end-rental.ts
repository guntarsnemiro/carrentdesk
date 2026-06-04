"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface EndRentalInput {
  bookingId: string;
  companyId: string;
  /** YYYY-MM-DD — the actual return date */
  actualReturnDate: string;
  /** Whether to mark the deposit as returned today */
  returnDeposit: boolean;
  /** Optional notes appended to existing booking notes */
  notes: string | null;
}

export async function endRental(
  input: EndRentalInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const db = createServiceRoleClient();

  // Verify membership
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", input.companyId)
    .maybeSingle();
  if (!membership) return { ok: false, error: "Access denied" };

  // Fetch the booking to validate it exists and belongs to this company
  const { data: booking } = await db
    .from("bookings")
    .select("id, status, notes, deposit_amount, deposit_returned_at, is_longterm")
    .eq("id", input.bookingId)
    .eq("company_id", input.companyId)
    .maybeSingle();

  if (!booking) return { ok: false, error: "Booking not found" };
  if (booking.status === "returned") return { ok: false, error: "Rental is already returned" };
  if (booking.status === "cancelled") return { ok: false, error: "Rental is cancelled" };

  // Build the actual return datetime — use noon local time to avoid timezone edge cases
  const actualEndAt = new Date(`${input.actualReturnDate}T12:00:00`).toISOString();

  // Build note append
  const terminationNote = `[Rental ended ${input.actualReturnDate}${input.notes ? ` — ${input.notes}` : ""}]`;
  const updatedNotes = booking.notes
    ? `${booking.notes}\n${terminationNote}`
    : terminationNote;

  const depositReturnedAt =
    input.returnDeposit && !booking.deposit_returned_at
      ? new Date().toISOString()
      : undefined;

  const { error } = await db
    .from("bookings")
    .update({
      status: "returned",
      end_at: actualEndAt,
      notes: updatedNotes,
      ...(depositReturnedAt ? { deposit_returned_at: depositReturnedAt } : {}),
    })
    .eq("id", input.bookingId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/rentals/${input.companyId}`);
  revalidatePath(`/app/rentals/${input.companyId}/${input.bookingId}`);
  revalidatePath(`/app/today/${input.companyId}`);

  return { ok: true };
}
