"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { endRental } from "../_actions/end-rental";

interface Props {
  bookingId: string;
  companyId: string;
  /** Current paid-through end date (ISO string) */
  currentEndAt: string;
  /** Original booking start (ISO string) */
  startAt: string;
  /** Amount paid for the current period */
  periodPrice: number | null;
  /** Renewal period length in days (null for short-term) */
  renewalPeriodDays: number | null;
  /** Deposit amount */
  depositAmount: number | null;
  /** Whether deposit was already returned */
  depositReturned: boolean;
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / 86_400_000));
}

export function EndRentalDialog({
  bookingId,
  companyId,
  currentEndAt,
  startAt,
  periodPrice,
  renewalPeriodDays,
  depositAmount,
  depositReturned,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(toDateInputValue(new Date().toISOString()));
  const [returnDepositNow, setReturnDepositNow] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Settlement calculation ────────────────────────────────────────
  const periodStart = new Date(currentEndAt);
  // For long-term: period started `renewalPeriodDays` ago from end_at
  const paidPeriodStart = renewalPeriodDays
    ? new Date(periodStart.getTime() - renewalPeriodDays * 86_400_000)
    : new Date(startAt);
  const periodEnd = new Date(currentEndAt);
  const actualReturn = new Date(returnDate + "T12:00:00");

  const totalPeriodDays = renewalPeriodDays ?? daysBetween(new Date(startAt), new Date(currentEndAt));
  const daysUsed = Math.max(0, daysBetween(paidPeriodStart, actualReturn));
  const daysRemaining = Math.max(0, totalPeriodDays - daysUsed);
  const isEarlyReturn = actualReturn < periodEnd;

  let settlement: { type: "credit" | "balance" | "none"; amount: number } = { type: "none", amount: 0 };
  if (periodPrice && totalPeriodDays > 0 && renewalPeriodDays) {
    const dailyRate = periodPrice / totalPeriodDays;
    const unusedAmount = Math.round(daysRemaining * dailyRate * 100) / 100;
    if (isEarlyReturn && unusedAmount > 0) {
      settlement = { type: "credit", amount: unusedAmount };
    }
  }

  const showDeposit = depositAmount && depositAmount > 0 && !depositReturned;

  function handleClose() {
    setOpen(false);
    setError(null);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await endRental({
        bookingId,
        companyId,
        actualReturnDate: returnDate,
        returnDeposit: returnDepositNow,
        notes: notes.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
      router.push(`/app/rentals/${companyId}`);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
      >
        End rental
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">End rental</h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                Set the actual return date and review settlement.
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Return date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Actual return date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  max={toDateInputValue(new Date(Date.now() + 366 * 86_400_000).toISOString())}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Settlement summary */}
              {renewalPeriodDays && periodPrice ? (
                <div className={`rounded-xl p-4 text-sm ${isEarlyReturn ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
                  <p className={`font-semibold ${isEarlyReturn ? "text-amber-800" : "text-green-800"}`}>
                    {isEarlyReturn ? "⚠ Early return" : "✓ Full period used"}
                  </p>
                  <div className="mt-2 space-y-1 text-neutral-700">
                    <div className="flex justify-between">
                      <span>Period length</span>
                      <span className="font-medium">{totalPeriodDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Days used</span>
                      <span className="font-medium">{Math.min(daysUsed, totalPeriodDays)} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Days unused</span>
                      <span className="font-medium">{daysRemaining} days</span>
                    </div>
                    {settlement.type === "credit" && (
                      <div className="mt-2 flex justify-between border-t border-amber-200 pt-2 font-semibold text-amber-800">
                        <span>Credit to customer</span>
                        <span>€{settlement.amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  {settlement.type === "credit" && (
                    <p className="mt-2 text-xs text-amber-600">
                      Issue a credit note or deduct from deposit if applicable.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface-soft p-4 text-sm text-neutral-600">
                  Rental will be marked as returned on the selected date.
                </div>
              )}

              {/* Deposit */}
              {showDeposit && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-4">
                  <input
                    id="return-deposit"
                    type="checkbox"
                    checked={returnDepositNow}
                    onChange={(e) => setReturnDepositNow(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="return-deposit" className="text-sm">
                    <span className="font-medium text-neutral-800">Return deposit</span>
                    <span className="ml-1 text-neutral-500">
                      (€{depositAmount!.toFixed(2)}) — mark as returned today
                    </span>
                  </label>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Notes <span className="font-normal text-neutral-400">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Condition on return, mileage, any issues…"
                  className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Ending…" : "Confirm end rental"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
