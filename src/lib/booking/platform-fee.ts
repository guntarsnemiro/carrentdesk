/** Card charge at booking. Full rental is collected by the rental at pickup. */
export const PLATFORM_FEE_RATE = 0.1;
export const PLATFORM_FEE_MINIMUM_EUR = 19;
export const PENDING_PAYMENT_HOLD_MINUTES = 30;

/** Round money to cents. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** CarRentDesk fee charged on the customer's card: max(10% of rental, €19). */
export function platformFee(rentalTotal: number): number {
  if (!Number.isFinite(rentalTotal) || rentalTotal < 0) {
    throw new RangeError("rentalTotal must be a non-negative finite number");
  }
  return Math.max(roundMoney(rentalTotal * PLATFORM_FEE_RATE), PLATFORM_FEE_MINIMUM_EUR);
}

/**
 * Rental length in days. Full 24h = 1 day; any extra minute starts the next day.
 * Minimum 1 day.
 */
export function rentalDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new RangeError("end must be after start");
  }
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export function rentalTotal(dailyRate: number, days: number): number {
  if (!Number.isFinite(dailyRate) || dailyRate < 0) {
    throw new RangeError("dailyRate must be a non-negative finite number");
  }
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError("days must be an integer >= 1");
  }
  return roundMoney(dailyRate * days);
}

export type QuoteBreakdown = {
  days: number;
  rentalTotal: number;
  platformFee: number;
};

export function quoteForDates(dailyRate: number, start: Date, end: Date): QuoteBreakdown {
  const days = rentalDays(start, end);
  const total = rentalTotal(dailyRate, days);
  return { days, rentalTotal: total, platformFee: platformFee(total) };
}
