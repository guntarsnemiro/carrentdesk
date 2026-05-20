/**
 * Core finance calculation functions.
 * All monetary values are in EUR. Dates are ISO strings (YYYY-MM-DD) or ISO timestamps.
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

/** First moment of a given year/month (local midnight UTC). */
export function monthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

/** Last moment of a given year/month (23:59:59.999 UTC). */
export function monthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 1) - 1);
}

/** Days between two dates (fractional). */
function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86_400_000;
}

// ─── pro-rata revenue ─────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  start_at: string;
  end_at: string;
  booking_price: number | null;
  paid_at: string | null;
  deposit_amount: number | null;
  deposit_returned_at: string | null;
  status: string;
  vehicle_id: string;
}

/**
 * Portion of a booking's price earned in a given calendar month.
 * Uses straight-line proration across the rental period.
 */
export function proRataRevenue(b: Booking, year: number, month: number): number {
  if (!b.booking_price || b.booking_price <= 0) return 0;

  const start = new Date(b.start_at);
  const end   = new Date(b.end_at);
  const ms    = monthStart(year, month);
  const me    = monthEnd(year, month);

  const overlapStart = start > ms ? start : ms;
  const overlapEnd   = end   < me ? end   : me;

  if (overlapEnd <= overlapStart) return 0;

  const totalDays   = Math.max(1, daysBetween(start, end));
  const overlapDays = daysBetween(overlapStart, overlapEnd);

  return (b.booking_price / totalDays) * overlapDays;
}

/** Total pro-rata revenue across all bookings for a month. */
export function monthProRataRevenue(bookings: Booking[], year: number, month: number): number {
  return bookings.reduce((s, b) => s + proRataRevenue(b, year, month), 0);
}

// ─── cash collected ───────────────────────────────────────────────────────────

/** Cash actually received from a booking in a given month (based on paid_at). */
export function cashCollectedInMonth(b: Booking, year: number, month: number): number {
  if (!b.paid_at || !b.booking_price) return 0;
  const d = new Date(b.paid_at);
  return d.getUTCFullYear() === year && d.getUTCMonth() === month ? b.booking_price : 0;
}

/** Deposits currently held (not yet returned). */
export function depositsHeld(bookings: Booking[]): number {
  return bookings.reduce((s, b) => {
    if (!b.deposit_amount || b.deposit_returned_at) return s;
    return s + b.deposit_amount;
  }, 0);
}

/** Deferred revenue: paid but not yet earned (future rental days). */
export function deferredRevenue(bookings: Booking[], asOf: Date): number {
  return bookings.reduce((s, b) => {
    if (!b.booking_price || !b.paid_at) return s;
    const end = new Date(b.end_at);
    if (end <= asOf) return s; // fully earned already
    const start = new Date(b.start_at);
    const totalDays = Math.max(1, daysBetween(start, end));
    const remainingStart = asOf > start ? asOf : start;
    const remainingDays = Math.max(0, daysBetween(remainingStart, end));
    return s + (b.booking_price / totalDays) * remainingDays;
  }, 0);
}

// ─── amortized costs ──────────────────────────────────────────────────────────

export interface PeriodCost {
  id: string;
  date: string;
  amount: number;        // for expenses
  cost?: number;         // for maintenance_logs
  covers_from: string | null;
  covers_until: string | null;
  vehicle_id?: string;
}

/**
 * Portion of a cost that falls in a given calendar month.
 * If covers_from/covers_until are set, the cost is amortized across that period.
 * Otherwise the full cost is booked in the payment month (date).
 */
export function amortizedCost(c: PeriodCost, year: number, month: number): number {
  const amount = c.amount ?? c.cost ?? 0;
  if (amount <= 0) return 0;

  if (c.covers_from && c.covers_until) {
    const from  = new Date(c.covers_from);
    const until = new Date(c.covers_until);
    const ms    = monthStart(year, month);
    const me    = monthEnd(year, month);

    const overlapStart = from  > ms ? from  : ms;
    const overlapEnd   = until < me ? until : me;

    if (overlapEnd <= overlapStart) return 0;

    const totalDays   = Math.max(1, daysBetween(from, until));
    const overlapDays = daysBetween(overlapStart, overlapEnd);
    return (amount / totalDays) * overlapDays;
  }

  // Point-in-time: book in the payment month
  const d = new Date(c.date);
  return d.getUTCFullYear() === year && d.getUTCMonth() === month ? amount : 0;
}

/** Total amortized costs across a list of cost items for a month. */
export function monthAmortizedCosts(costs: PeriodCost[], year: number, month: number): number {
  return costs.reduce((s, c) => s + amortizedCost(c, year, month), 0);
}

// ─── depreciation ─────────────────────────────────────────────────────────────

export interface VehicleAsset {
  id: string;
  purchase_price: number | null;
  purchase_date: string | null;
  depreciation_rate: number | null;   // %/year; null = use company default
  residual_value: number | null;
  depreciation_mode: string | null;   // 'current_value' | 'original' | 'none'
  disposed_at: string | null;
  disposal_price: number | null;
}

/**
 * Straight-line monthly depreciation for a vehicle in a given calendar month.
 * Returns 0 if depreciation_mode is 'none' or data is missing.
 */
export function monthlyDepreciation(
  v: VehicleAsset,
  companyRate: number, // %/year default
  year: number,
  month: number,
): number {
  if (!v.purchase_price || !v.purchase_date) return 0;
  if (v.depreciation_mode === 'none' || !v.depreciation_mode) return 0;

  const rate          = v.depreciation_rate ?? companyRate;
  const residual      = v.residual_value ?? 0;
  const depreciable   = Math.max(0, v.purchase_price - residual);
  const monthlyRate   = rate / 100 / 12;
  const baseMonthlyDep = depreciable * monthlyRate;

  const purchaseDate = new Date(v.purchase_date);
  const ms = monthStart(year, month);
  const me = monthEnd(year, month);

  // Not yet purchased
  if (purchaseDate > me) return 0;

  // Already disposed before this month
  if (v.disposed_at && new Date(v.disposed_at) < ms) return 0;

  // Pro-rate for partial months (purchase or disposal mid-month)
  const daysInMonth  = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let activeDays = daysInMonth;

  if (
    purchaseDate.getUTCFullYear() === year &&
    purchaseDate.getUTCMonth() === month
  ) {
    activeDays = Math.min(activeDays, daysInMonth - purchaseDate.getUTCDate() + 1);
  }

  if (v.disposed_at) {
    const d = new Date(v.disposed_at);
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month) {
      activeDays = Math.min(activeDays, d.getUTCDate());
    }
  }

  return baseMonthlyDep * (activeDays / daysInMonth);
}

/** Total depreciation across all vehicles for a month. */
export function fleetMonthlyDepreciation(
  vehicles: VehicleAsset[],
  companyRate: number,
  year: number,
  month: number,
): number {
  return vehicles.reduce((s, v) => s + monthlyDepreciation(v, companyRate, year, month), 0);
}

// ─── disposal gain / loss ─────────────────────────────────────────────────────

/**
 * One-time gain (positive) or loss (negative) when a vehicle is disposed of.
 * Posted to the month of disposal.
 */
export function disposalGainLoss(
  v: VehicleAsset,
  companyRate: number,
  year: number,
  month: number,
): number {
  if (!v.disposed_at || v.disposal_price == null) return 0;
  if (!v.purchase_price || !v.purchase_date) return 0;

  const disposedAt = new Date(v.disposed_at);
  if (disposedAt.getUTCFullYear() !== year || disposedAt.getUTCMonth() !== month) return 0;

  const rate        = v.depreciation_rate ?? companyRate;
  const residual    = v.residual_value ?? 0;
  const depreciable = Math.max(0, v.purchase_price - residual);
  const monthlyDep  = depreciable * (rate / 100 / 12);

  const purchaseDate  = new Date(v.purchase_date);
  const monthsActive  =
    (disposedAt.getUTCFullYear() - purchaseDate.getUTCFullYear()) * 12 +
    (disposedAt.getUTCMonth()    - purchaseDate.getUTCMonth());

  const bookValue = Math.max(0, v.purchase_price - monthlyDep * monthsActive);
  return v.disposal_price - bookValue;
}

// ─── P&L row ─────────────────────────────────────────────────────────────────

export interface PLRow {
  year: number;
  month: number;          // 0-indexed
  label: string;          // "Jan 2026"
  revenue: number;        // pro-rata earned
  cashCollected: number;  // actually received (paid_at)
  cashCosts: number;      // amortized maint + biz expenses
  depreciation: number;
  disposalGL: number;     // disposal gain/loss
  ebitda: number;         // revenue - cashCosts
  netProfit: number;      // ebitda - depreciation + disposalGL
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function buildPLRows(
  bookings: Booking[],
  costs: PeriodCost[],
  vehicles: VehicleAsset[],
  companyRate: number,
  monthCount = 12,
): PLRow[] {
  const now = new Date();
  const rows: PLRow[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const d     = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year  = d.getUTCFullYear();
    const month = d.getUTCMonth();

    const revenue      = monthProRataRevenue(bookings, year, month);
    const cashColl     = bookings.reduce((s, b) => s + cashCollectedInMonth(b, year, month), 0);
    const cashCosts    = monthAmortizedCosts(costs, year, month);
    const depr         = fleetMonthlyDepreciation(vehicles, companyRate, year, month);
    const dispGL       = vehicles.reduce((s, v) => s + disposalGainLoss(v, companyRate, year, month), 0);
    const ebitda       = revenue - cashCosts;
    const netProfit    = ebitda - depr + dispGL;

    rows.push({
      year, month,
      label:        `${MONTH_LABELS[month]} ${year}`,
      revenue,
      cashCollected: cashColl,
      cashCosts,
      depreciation: depr,
      disposalGL:   dispGL,
      ebitda,
      netProfit,
    });
  }

  return rows;
}
