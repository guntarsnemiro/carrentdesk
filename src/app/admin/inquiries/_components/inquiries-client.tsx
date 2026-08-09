"use client";

import { useState, useTransition } from "react";
import { updateInquiryStatus, updateInquiryNotes, adminSendQuoteToCustomer, generateRentalInviteLink, type InquiryStatus } from "../_actions";
import { useRouter } from "next/navigation";

type Inquiry = {
  id: string;
  created_at: string;
  company_name: string | null;
  company_slug: string | null;
  company_id: string | null;
  city_slug: string | null;
  pickup_datetime: string;
  return_datetime: string;
  pickup_location: string;
  return_location: string | null;
  vehicle_type: string;
  cross_border: boolean;
  cross_border_countries: string[];
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  driver_age: number;
  payment_method: string | null;
  no_deposit: boolean;
  child_seats: number;
  additional_driver: boolean;
  automatic_transmission: boolean;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  forwarded_at: string | null;
  operator_response: string | null;
  quoted_price: number | null;
  company: { whatsapp: string | null; phone: string | null } | null;
};

const STATUSES: { key: InquiryStatus; label: string; color: string }[] = [
  { key: "new",       label: "New",       color: "bg-blue-100 text-blue-800" },
  { key: "forwarded", label: "Forwarded", color: "bg-yellow-100 text-yellow-800" },
  { key: "quoted",    label: "Quoted",    color: "bg-orange-100 text-orange-800" },
  { key: "booked",    label: "Booked 🎉", color: "bg-green-100 text-green-800" },
  { key: "declined",  label: "Declined",  color: "bg-red-100 text-red-700" },
  { key: "lost",      label: "Lost",      color: "bg-neutral-100 text-neutral-600" },
];

const VEHICLE_LABELS: Record<string, string> = {
  compact: "Compact", mid_size: "Mid-size", big: "Full-size",
  suv: "SUV", minivan: "Minivan 7s", bus: "Bus 9s", any: "Any",
};
const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash", debit: "Debit", paypal: "PayPal",
  bank_transfer: "Bank transfer", other: "Other",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }) + " " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function days(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function InquiriesClient({
  inquiries,
  counts,
}: {
  inquiries: Inquiry[];
  counts: Record<string, number>;
}) {
  const [filter, setFilter] = useState<InquiryStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  const visible = filter === "all"
    ? inquiries
    : inquiries.filter((i) => i.status === filter);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-white px-8 py-5">
        <h1 className="text-xl font-bold text-neutral-900">Inquiries</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Quote requests from company pages — forward manually to the rental, then update status.
        </p>

        {/* Status filter tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            All ({inquiries.length})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === s.key
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {s.label} {counts[s.key] ? `(${counts[s.key]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3">
        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
            <p className="text-sm text-neutral-500">No inquiries yet.</p>
          </div>
        )}

        {visible.map((inq) => (
          <InquiryRow
            key={inq.id}
            inq={inq}
            expanded={expanded === inq.id}
            onToggle={() => setExpanded(expanded === inq.id ? null : inq.id)}
            onUpdated={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  );
}

function InquiryRow({
  inq,
  expanded,
  onToggle,
  onUpdated,
}: {
  inq: Inquiry;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(inq.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [quoteMsg, setQuoteMsg] = useState(inq.operator_response ?? "");
  const [quotePrice, setQuotePrice] = useState(inq.quoted_price != null ? String(inq.quoted_price) : "");
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteSent, setQuoteSent] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteEmailed, setInviteEmailed] = useState(false);

  const statusMeta = STATUSES.find((s) => s.key === inq.status) ?? STATUSES[0];
  const d = days(inq.pickup_datetime, inq.return_datetime);

  function handleStatusChange(status: InquiryStatus) {
    startTransition(async () => {
      await updateInquiryStatus(inq.id, status);
      onUpdated();
    });
  }

  async function handleSaveNotes() {
    setSaving(true);
    await updateInquiryNotes(inq.id, notes);
    setSaving(false);
    onUpdated();
  }

  async function handleSendQuote(e: React.FormEvent) {
    e.preventDefault();
    setQuoteError("");
    setQuoteSending(true);
    const result = await adminSendQuoteToCustomer(inq.id, {
      operator_response: quoteMsg,
      quoted_price: quotePrice ? parseFloat(quotePrice) : null,
    });
    setQuoteSending(false);
    if (result.ok) {
      setQuoteSent(true);
      onUpdated();
    } else {
      setQuoteError(result.error);
    }
  }

  async function handleGenerateInviteLink() {
    if (!inq.company_id) { setInviteError("No company linked to this inquiry"); return; }
    setInviteError("");
    setInviteLoading(true);
    const result = await generateRentalInviteLink(inq.company_id, inviteEmail.trim() || undefined);
    setInviteLoading(false);
    if (result.ok) {
      setInviteLink(result.url);
      if (inviteEmail.trim()) setInviteEmailed(true);
    } else {
      setInviteError(result.error);
    }
  }

  // Rental's contact number — prefer WhatsApp, fall back to phone
  const rentalWaNumber = (inq.company?.whatsapp || inq.company?.phone || "").replace(/\D/g, "");

  // Build WhatsApp forward message — uses magic login link if generated, falls back to /app/quotes
  const loginLink = inviteLink || `https://carrentdesk.com/app/quotes/${inq.company_id ?? ""}`;
  const waText = encodeURIComponent(
    `Hi, I have a quote request for you via CarRentDesk:\n\n` +
    `📅 Pickup: ${fmt(inq.pickup_datetime)}\n` +
    `📅 Return: ${fmt(inq.return_datetime)} (${d} days)\n` +
    `📍 Location: ${inq.pickup_location}${inq.return_location ? ` → ${inq.return_location}` : ""}\n` +
    `🚗 Car: ${VEHICLE_LABELS[inq.vehicle_type] ?? inq.vehicle_type}${inq.automatic_transmission ? " (automatic)" : ""}\n` +
    `👤 Driver: ${inq.customer_name}, age ${inq.driver_age}\n` +
    `📞 Phone: ${inq.customer_phone}${inq.customer_email ? `\n📧 Email: ${inq.customer_email}` : ""}\n` +
    `💳 Payment: ${inq.payment_method ? (PAYMENT_LABELS[inq.payment_method] ?? inq.payment_method) : "not specified"}${inq.no_deposit ? " — prefers no deposit" : ""}\n` +
    (inq.child_seats > 0 ? `👶 Child seats: ${inq.child_seats}\n` : "") +
    (inq.additional_driver ? `👥 Additional driver: yes\n` : "") +
    (inq.cross_border && inq.cross_border_countries?.length ? `🌍 Cross-border: ${inq.cross_border_countries.join(", ")}\n` : "") +
    (inq.notes ? `📝 Notes: ${inq.notes}\n` : "") +
    `\nInterested? Click to reply with a price:\n${loginLink}`
  );

  async function handleWhatsAppWithLink() {
    // Generate a fresh claim token first, then open WhatsApp with it embedded
    if (!inq.company_id) { window.open(`https://wa.me/${rentalWaNumber}?text=${waText}`, "_blank"); return; }
    setInviteLoading(true);
    const result = await generateRentalInviteLink(inq.company_id);
    setInviteLoading(false);
    if (result.ok) {
      setInviteLink(result.url);
      const msgWithLink = encodeURIComponent(
        `Hi, I have a quote request for you via CarRentDesk:\n\n` +
        `📅 Pickup: ${fmt(inq.pickup_datetime)}\n` +
        `📅 Return: ${fmt(inq.return_datetime)} (${d} days)\n` +
        `📍 Location: ${inq.pickup_location}${inq.return_location ? ` → ${inq.return_location}` : ""}\n` +
        `🚗 Car: ${VEHICLE_LABELS[inq.vehicle_type] ?? inq.vehicle_type}${inq.automatic_transmission ? " (automatic)" : ""}\n` +
        `👤 Driver: ${inq.customer_name}, age ${inq.driver_age}\n` +
        `📞 Phone: ${inq.customer_phone}${inq.customer_email ? `\n📧 Email: ${inq.customer_email}` : ""}\n` +
        `💳 Payment: ${inq.payment_method ? (PAYMENT_LABELS[inq.payment_method] ?? inq.payment_method) : "not specified"}${inq.no_deposit ? " — prefers no deposit" : ""}\n` +
        (inq.child_seats > 0 ? `👶 Child seats: ${inq.child_seats}\n` : "") +
        (inq.additional_driver ? `👥 Additional driver: yes\n` : "") +
        (inq.cross_border && inq.cross_border_countries?.length ? `🌍 Cross-border: ${inq.cross_border_countries.join(", ")}\n` : "") +
        (inq.notes ? `📝 Notes: ${inq.notes}\n` : "") +
        `\nInterested? Click your private link to reply with a price:\n${result.url}`
      );
      window.open(`https://wa.me/${rentalWaNumber}?text=${msgWithLink}`, "_blank");
    } else {
      // Fall back to plain link
      window.open(`https://wa.me/${rentalWaNumber}?text=${waText}`, "_blank");
    }
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
            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
            <span className="font-semibold text-sm text-neutral-900">
              {inq.company_name ?? inq.city_slug}
            </span>
            <span className="text-xs text-neutral-400">
              {VEHICLE_LABELS[inq.vehicle_type] ?? inq.vehicle_type} · {d}d
            </span>
            <span className="text-xs text-neutral-400">
              {new Date(inq.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-600 truncate">
            {inq.customer_name} · {inq.customer_phone} ·{" "}
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
          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Detail label="Pickup" value={fmt(inq.pickup_datetime)} />
            <Detail label="Return" value={fmt(inq.return_datetime) + ` (${d} days)`} />
            <Detail label="Pickup location" value={inq.pickup_location} />
            {inq.return_location && <Detail label="Return location" value={inq.return_location} />}
            <Detail label="Car type" value={VEHICLE_LABELS[inq.vehicle_type] ?? inq.vehicle_type} />
            <Detail label="Company" value={
              inq.company_slug
                ? `${inq.company_name} — carrentdesk.com/c/${inq.company_slug}`
                : inq.city_slug ?? "—"
            } />
            <Detail label="Customer" value={inq.customer_name} />
            <Detail label="Driver age" value={String(inq.driver_age)} />
            <Detail label="Phone" value={inq.customer_phone} />
            {inq.customer_email && <Detail label="Email" value={inq.customer_email} />}
            <Detail label="Payment" value={
              (inq.payment_method ? (PAYMENT_LABELS[inq.payment_method] ?? inq.payment_method) : "—") +
              (inq.no_deposit ? " — no deposit" : "")
            } />
            {(inq.child_seats > 0 || inq.additional_driver || inq.automatic_transmission) && (
              <Detail label="Extras" value={[
                inq.automatic_transmission ? "Automatic transmission" : null,
                inq.child_seats > 0 ? `Child seats ×${inq.child_seats}` : null,
                inq.additional_driver ? "Additional driver" : null,
              ].filter(Boolean).join(", ")} />
            )}
            {inq.cross_border && inq.cross_border_countries?.length > 0 && (
              <Detail label="Cross-border" value={inq.cross_border_countries.join(", ")} />
            )}
            {inq.notes && <Detail label="Notes" value={inq.notes} />}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
            <span className="text-xs font-medium text-neutral-500 mr-1">Status:</span>
            {STATUSES.map((s) => (
              <button
                key={s.key}
                disabled={inq.status === s.key || isPending}
                onClick={() => handleStatusChange(s.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                  inq.status === s.key
                    ? s.color + " ring-1 ring-offset-1 ring-current"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Forward buttons */}
          <div className="flex flex-wrap gap-2">
            {rentalWaNumber ? (
              <button
                onClick={handleWhatsAppWithLink}
                disabled={inviteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                <WhatsAppIcon />
                {inviteLoading ? "Generating link…" : "Forward to rental via WhatsApp"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-xs text-neutral-500">
                No rental WhatsApp/phone on file
              </span>
            )}
            {inq.company_slug && (
              <a
                href={`https://carrentdesk.com/c/${inq.company_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                View listing ↗
              </a>
            )}
          </div>

          {/* Invite rental to platform */}
          {inq.company_id && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <h4 className="text-xs font-semibold text-blue-900 mb-0.5">Invite rental to platform</h4>
              <p className="text-xs text-blue-700 mb-3">
                Generate a 30-day login link. Optionally send it by email too.
              </p>
              {inviteLink ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-neutral-800 font-mono"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(inviteLink)}
                      className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                  {inviteEmailed && (
                    <p className="text-xs text-green-700 font-medium">✓ Invite email sent to {inviteEmail}</p>
                  )}
                  <p className="text-xs text-blue-600">Valid for 30 days.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="rental@email.com — leave blank for link only"
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
                  />
                  {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
                  <button
                    onClick={handleGenerateInviteLink}
                    disabled={inviteLoading}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviteLoading
                      ? "Sending…"
                      : inviteEmail.trim()
                      ? "Generate link + send email"
                      : "Generate link only"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Admin notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Forwarded to operator, they said…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="mt-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save notes"}
            </button>
          </div>

          {/* Send quote to customer */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <h4 className="text-xs font-semibold text-amber-900 mb-0.5">
              Send rental quote to customer
            </h4>
            <p className="text-xs text-amber-700 mb-3">
              Got an offer from the rental via WhatsApp? Enter it here and we&apos;ll email the customer.
            </p>
            {quoteSent ? (
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Quote emailed to {inq.customer_email ?? inq.customer_name} ✓
              </div>
            ) : (
              <form onSubmit={handleSendQuote} className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-amber-800 mb-1">Price (€) — optional</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      placeholder="e.g. 550"
                      className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-amber-800 mb-1">Message / offer details *</label>
                  <textarea
                    rows={4}
                    required
                    value={quoteMsg}
                    onChange={(e) => setQuoteMsg(e.target.value)}
                    placeholder={
                      `e.g.\nWe have a Fiat Tipo 2025, manual transmission.\nFull insurance, no deposit.\nDelivery & drop-off to airport included.\nCash payment on arrival.\n€550 total.`
                    }
                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                  />
                </div>
                {quoteError && (
                  <p className="text-xs text-red-600">{quoteError}</p>
                )}
                {!inq.customer_email && (
                  <p className="text-xs text-red-600">⚠ This inquiry has no customer email — cannot send.</p>
                )}
                <button
                  type="submit"
                  disabled={quoteSending || !inq.customer_email}
                  className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {quoteSending ? "Sending…" : "Email quote to customer"}
                </button>
              </form>
            )}
          </div>
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

function WhatsAppIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
