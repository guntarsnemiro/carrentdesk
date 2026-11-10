export type CancelReason = "unavailable" | "customer" | "operator";

export async function cancelBooking(companyId: string, bookingId: string, reason: CancelReason): Promise<{ refunded: boolean }> {
  const res = await fetch("/api/booking/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, bookingId, reason }),
  });
  const data = (await res.json().catch(() => null)) as { error?: string; refunded?: boolean } | null;
  if (!res.ok) throw new Error(data?.error || "Could not cancel the booking.");
  return { refunded: Boolean(data?.refunded) };
}
