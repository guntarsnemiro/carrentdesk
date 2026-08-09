"use client";

import { useState, useTransition } from "react";
import { respondToQuote } from "./_actions";

type Props = {
  token: string;
  companyName: string;
  customerName: string;
  pickupDatetime: string;
  returnDatetime: string;
  pickupLocation: string;
  vehicleType: string;
  quotedPrice: number | null;
  operatorResponse: string | null;
  alreadyResponded: "accepted" | "declined" | null;
};

const VEHICLE_LABELS: Record<string, string> = {
  compact: "Compact", mid_size: "Mid-size", big: "Full-size",
  suv: "SUV", minivan: "Minivan (7 seats)", bus: "Bus (9 seats)", any: "Any / Best price",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }) + " " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function days(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function QuoteResponseClient(props: Props) {
  const [result, setResult] = useState<"accepted" | "declined" | null>(
    props.alreadyResponded
  );
  const [isPending, startTransition] = useTransition();
  const d = days(props.pickupDatetime, props.returnDatetime);

  function handleAction(action: "accepted" | "declined") {
    startTransition(async () => {
      const res = await respondToQuote(props.token, action);
      if (res.ok) setResult(res.action);
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-xl font-bold text-neutral-900 tracking-tight">
            Car<span className="text-brand-600">Rent</span>Desk
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-sm p-6 space-y-5">
          {/* Trip summary */}
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Your rental quote</p>
            <div className="rounded-xl bg-neutral-50 border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">From</span>
                <span className="font-medium text-neutral-900">{props.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Car</span>
                <span className="font-medium text-neutral-900">
                  {VEHICLE_LABELS[props.vehicleType] ?? props.vehicleType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pickup</span>
                <span className="font-medium text-neutral-900">{fmt(props.pickupDatetime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Return</span>
                <span className="font-medium text-neutral-900">{fmt(props.returnDatetime)} ({d} days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Location</span>
                <span className="font-medium text-neutral-900">{props.pickupLocation}</span>
              </div>
              {props.quotedPrice != null && (
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-neutral-500 font-medium">Total price</span>
                  <span className="text-lg font-bold text-neutral-900">€{props.quotedPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rental message */}
          {props.operatorResponse && (
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Message from rental</p>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-neutral-800 whitespace-pre-wrap">
                {props.operatorResponse}
              </div>
            </div>
          )}

          {/* Response area */}
          {result === null ? (
            <div className="space-y-3 pt-1">
              <p className="text-sm text-neutral-600 text-center">
                Hi <strong>{props.customerName}</strong>, do you want to accept this offer?
              </p>
              <button
                onClick={() => handleAction("accepted")}
                disabled={isPending}
                className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Processing…" : "✓ Yes, I accept this offer"}
              </button>
              <button
                onClick={() => handleAction("declined")}
                disabled={isPending}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
              >
                No thanks, I&apos;ll look elsewhere
              </button>
            </div>
          ) : result === "accepted" ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center space-y-2">
              <div className="text-3xl">🎉</div>
              <p className="font-semibold text-green-900">Booking confirmed!</p>
              <p className="text-sm text-green-700">
                Great choice! {props.companyName} has been notified and will be in touch to finalise the details.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-neutral-100 border border-border p-5 text-center space-y-2">
              <div className="text-3xl">👍</div>
              <p className="font-semibold text-neutral-700">Got it, no problem.</p>
              <p className="text-sm text-neutral-500">
                Your response has been recorded. Feel free to browse other rentals on CarRentDesk.
              </p>
              <a
                href="/"
                className="inline-block mt-2 text-sm text-brand-600 font-medium hover:underline"
              >
                Browse rentals →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
