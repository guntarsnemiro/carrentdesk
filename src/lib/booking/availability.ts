export type BlockingBooking = {
  id: string;
  vehicle_id: string;
  start_at: string;
  end_at: string;
  status: string;
  pending_expires_at?: string | null;
};

/** Standard interval overlap: [start, end). */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function stillHolding(booking: BlockingBooking, now: Date): boolean {
  if (booking.status === "cancelled") return false;
  if (booking.status === "pending_payment") {
    if (!booking.pending_expires_at) return true;
    return new Date(booking.pending_expires_at) > now;
  }
  return true;
}

/** True if this vehicle already has a live (or unexpired hold) booking on these dates. */
export function isVehicleBlocked(
  bookings: BlockingBooking[],
  vehicleId: string,
  start: Date,
  end: Date,
  opts?: { excludeBookingId?: string; now?: Date },
): boolean {
  const now = opts?.now ?? new Date();
  return bookings.some((b) => {
    if (b.vehicle_id !== vehicleId) return false;
    if (opts?.excludeBookingId && b.id === opts.excludeBookingId) return false;
    if (!stillHolding(b, now)) return false;
    return rangesOverlap(start, end, new Date(b.start_at), new Date(b.end_at));
  });
}
