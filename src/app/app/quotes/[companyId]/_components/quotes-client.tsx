"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitQuoteResponse } from "../_actions";

const VEHICLE_LABELS: Record<string, string> = {
  compact: "Compact", mid_size: "Mid-size", big: "Full-size",
  suv: "SUV", minivan: "Minivan 7s", bus: "Bus 9s", any: "Any",
};
const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash", debit: "Debit card", paypal: "PayPal",
  bank_transfer: "Bank transfer", other: "Other",
};

export type QuoteInquiry = {
  id: string;
  created_at: string;
  pickup_datetime: string;
  return_datetime: string;
  pickup_location: string;
  return_location: string | null;
  vehicle_type: string;
  automatic_transmission: boolean;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  driver_age: number;
  payment_method: string | null;
  no_deposit: boolean;
  child_seats: number;
  additional_driver: boolean;
  cross_border: boolean;
  cross_border_countries: string[];
  notes: string | null;
  status: string;
  operator_response: string | null;
  quoted_price: number | null;
  operator_response_at: string | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }) + " " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function days(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function QuotesClient({
  inquiries,
  companyId,
  newCount,
}: {
  inquiries: QuoteInquiry[];
  companyId: string;
  newCount: number;
}) {
  const [tab, setTab] = useState<"new" | "quoted" | "all">("new");
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = tab === "all"
    ? inquiries
    : tab === "new"
      ? inquiries.filter((i) => i.status === "new" || i.status === "forwarded")
      : inquiries.filter((i) => i.status === "quoted" || i.status === "booked");

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Quote requests</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Customers who requested a price from your rental. Respond to send them your quote by email.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        {([
          { key: "new",    label: `New${newCount > 0 ? ` (${newCount})` : ""}` },
          { key: "quoted", label: "Quoted" },
          { key: "all",    label: "All" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-brand-900 text-white"
                : "bg-white text-neutral-600 ring-1 ring-border hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">
            {tab === "new" ? "No new quote requests." : "Nothing here yet."}
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            When customers request a quote from your listing, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((inq) => (
            <InquiryRow
              key={inq.id}
              inq={inq}
              companyId={companyId}
              expanded={expanded === inq.id}
              onToggle={() => setExpanded(expanded === inq.id ? null : inq.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InquiryRow({
  inq,
  companyId,
  expanded,
  onToggle,
}: {
  inq: QuoteInquiry;
  companyId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState(inq.operator_response ?? "");
  const [price, setPrice] = useState(inq.quoted_price != null ? String(inq.quoted_price) : "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const d = days(inq.pickup_datetime, inq.return_datetime);
  const isNew = inq.status === "new" || inq.status === "forwarded";
  const isQuoted = inq.status === "quoted" || inq.status === "booked";

  const statusColor = isNew
    ? "bg-blue-100 text-blue-800"
    : isQuoted
      ? "bg-green-100 text-green-800"
      : "bg-neutral-100 text-neutral-600";
  const statusLabel = isNew ? "New" : isQuoted ? "Quoted" : inq.status;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsedPrice = price ? parseFloat(price) : null;
    startTransition(async () => {
      const result = await submitQuoteResponse(inq.id, companyId, {
        operator_response: message,
        quoted_price: parsedPrice,
      });
      if (result.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className={`rounded-2xl border bg-white transition-shadow ${expanded ? "shadow-md border-brand-200" : "border-border hover:border-neutral-300"}`}>
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor}`}>
              {statusLabel}
            </span>
            <span className="font-semibold text-sm text-neutral-900">
              {inq.customer_name}
            </span>
            <span className="text-xs text-neutral-400">
              {VEHICLE_LABELS[inq.vehicle_type] ?? inq.vehicle_type}
              {inq.automatic_transmission ? " · auto" : ""}
              {" · "}{d}d
            </span>
            <span className="text-xs text-neutral-400">
              {new Date(inq.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-600 truncate">
            {new Date(inq.pickup_datetime).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            {" → "}
            {new Date(inq.return_datetime).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            {" · "}{inq.pickup_location}
          </p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 mt-0.5 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-5">
          {/* Trip + driver details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Detail label="Pickup" value={fmt(inq.pickup_datetime)} />
            <Detail label="Return" value={`${fmt(inq.return_datetime)} (${d} days)`} />
            <Detail label="Pickup location" value={inq.pickup_location} />
            {inq.return_location && <Detail label="Return location" value={inq.return_location} />}
            <Detail label="Car type" value={`${VEHICLE_LABELS[inq.vehicle_type] ?? inq.vehicle_type}${inq.automatic_transmission ? " (automatic)" : ""}`} />
            <Detail label="Customer" value={inq.customer_name} />
            <Detail label="Driver age" value={String(inq.driver_age)} />
            <Detail label="Phone" value={inq.customer_phone} />
            {inq.customer_email && <Detail label="Email" value={inq.customer_email} />}
            <Detail label="Payment" value={
              (inq.payment_method ? (PAYMENT_LABELS[inq.payment_method] ?? inq.payment_method) : "—") +
              (inq.no_deposit ? " — no deposit" : "")
            } />
            {(inq.child_seats > 0 || inq.additional_driver) && (
              <Detail label="Extras" value={[
                inq.child_seats > 0 ? `Child seats ×${inq.child_seats}` : null,
                inq.additional_driver ? "Additional driver" : null,
              ].filter(Boolean).join(", ")} />
            )}
            {inq.cross_border && inq.cross_border_countries?.length > 0 && (
              <Detail label="Cross-border" value={inq.cross_border_countries.join(", ")} />
            )}
            {inq.notes && <Detail label="Notes" value={inq.notes} />}
          </div>

          {/* Already quoted — show previous response */}
          {isQuoted && inq.operator_response && !success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm">
              <p className="font-medium text-green-900 mb-1">Your quote was sent to the customer</p>
              {inq.quoted_price && (
                <p className="text-green-800">Price: €{Number(inq.quoted_price).toFixed(2)}</p>
              )}
              <p className="text-green-800 mt-1">{inq.operator_response}</p>
              <p className="mt-2 text-xs text-green-600">
                Sent {inq.operator_response_at ? fmt(inq.operator_response_at) : ""}
              </p>
            </div>
          )}

          {/* Response form — show for new inquiries or to update */}
          {(isNew || success === false) && (
            <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {isQuoted ? "Update your quote" : "Send your quote"}
              </p>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Your price — total (optional)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-neutral-400">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 280"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 pl-7 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Your message to the customer <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what you can offer — car model, included services, pickup arrangements, availability…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 ring-1 ring-green-200">
                  Quote sent! The customer will receive it by email.
                </p>
              )}

              {!success && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
                >
                  {isPending ? "Sending…" : inq.customer_email ? "Send quote to customer" : "Save quote (no customer email on file)"}
                </button>
              )}

              {!inq.customer_email && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 ring-1 ring-amber-200">
                  This customer did not provide an email. The quote will be saved but cannot be emailed automatically.
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-neutral-400">{label}</span>
      <p className="text-sm text-neutral-900 break-words">{value || "—"}</p>
    </div>
  );
}
