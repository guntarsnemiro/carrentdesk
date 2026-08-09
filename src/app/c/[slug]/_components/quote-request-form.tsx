"use client";

import { useState, useTransition } from "react";
import type { Listing } from "@/lib/listings";
import { submitInquiry } from "../_actions/submit-inquiry";

const VEHICLE_TYPES = [
  { key: "compact",  label: "Compact" },
  { key: "mid_size", label: "Mid-size" },
  { key: "big",      label: "Full-size" },
  { key: "suv",      label: "SUV" },
  { key: "minivan",  label: "Minivan 7 seats" },
  { key: "bus",      label: "Bus 9 seats" },
  { key: "any",      label: "Any / Best price" },
] as const;

const PAYMENT_METHODS = [
  { key: "cash",          label: "Cash" },
  { key: "debit",         label: "Debit card" },
  { key: "paypal",        label: "PayPal" },
  { key: "bank_transfer", label: "Bank transfer" },
  { key: "other",         label: "Other" },
] as const;

const EU_COUNTRIES = [
  "Albania", "Austria", "Bosnia", "Bulgaria", "Croatia", "Cyprus",
  "Czech Republic", "Germany", "Greece", "Hungary", "Italy", "Kosovo",
  "Malta", "Montenegro", "North Macedonia", "Poland", "Portugal",
  "Romania", "Serbia", "Slovakia", "Slovenia", "Spain", "Turkey",
].sort();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function weekFromTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 8);
  return d.toISOString().slice(0, 10);
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

interface Props {
  listing: Listing;
  citySlug: string;
  cityName: string;
  country: string;
}

export function QuoteRequestForm({ listing, citySlug, cityName, country }: Props) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    pickup_date: tomorrowDate(),
    pickup_time: "10:00",
    return_date: weekFromTomorrowDate(),
    return_time: "10:00",
    pickup_location: "",
    different_return: false,
    return_location: "",
    vehicle_type: "suv",
    automatic_transmission: false,
    cross_border: false,
    cross_border_countries: [] as string[],
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    driver_age: "",
    payment_method: "cash",
    no_deposit: false,
    child_seats: 0,
    additional_driver: false,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customer_name.trim()) e.customer_name = "Required";
    if (!form.customer_phone.trim()) e.customer_phone = "Required";
    if (!form.customer_email.trim()) e.customer_email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) e.customer_email = "Invalid email";
    if (!form.pickup_location.trim()) e.pickup_location = "Required";
    if (form.different_return && !form.return_location.trim()) e.return_location = "Required";
    const age = parseInt(form.driver_age);
    if (!form.driver_age || isNaN(age) || age < 18 || age > 99) e.driver_age = "Enter age (18–99)";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickup = new Date(form.pickup_date + "T" + form.pickup_time);
    const ret = new Date(form.return_date + "T" + form.return_time);
    if (!form.pickup_date) e.pickup_date = "Required";
    else if (pickup < today) e.pickup_date = "Pickup date cannot be in the past";
    if (!form.return_date) e.return_date = "Required";
    if (form.pickup_date && form.return_date && ret <= pickup) e.return_date = "Return must be after pickup";
    if (form.cross_border && form.cross_border_countries.length === 0) {
      e.cross_border_countries = "Select at least one country";
    }
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setServerError("");

    const pickupIso = new Date(form.pickup_date + "T" + form.pickup_time).toISOString();
    const returnIso = new Date(form.return_date + "T" + form.return_time).toISOString();

    startTransition(async () => {
      const result = await submitInquiry({
        company_id: listing.id,
        company_slug: listing.slug,
        company_name: listing.name,
        city_slug: citySlug,
        pickup_datetime: pickupIso,
        return_datetime: returnIso,
        pickup_location: form.pickup_location.trim(),
        return_location: form.different_return ? form.return_location.trim() : "",
        vehicle_type: form.vehicle_type,
        automatic_transmission: form.automatic_transmission,
        cross_border: form.cross_border,
        cross_border_countries: form.cross_border_countries,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim(),
        driver_age: parseInt(form.driver_age),
        payment_method: form.payment_method,
        no_deposit: form.no_deposit,
        child_seats: form.child_seats,
        additional_driver: form.additional_driver,
        notes: form.notes.trim(),
      });

      if (result.ok) {
        setSubmitted(true);
      } else {
        setServerError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <div className="rounded-2xl bg-brand-50 p-6 ring-1 ring-brand-200">
        <h3 className="text-sm font-semibold text-brand-900">Request a quote</h3>
        <p className="mt-1 text-sm text-brand-700">
          This rental is based in{" "}
          <span className="font-medium">{cityName}, {country}</span>.
          Send your trip details and they will contact you with price and availability.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          Get a quote
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-green-50 p-6 ring-1 ring-green-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold text-green-900">Quote request sent!</p>
            <p className="mt-1 text-sm text-green-800">
              We&apos;ll review your request and contact {listing.name} on your behalf.
              Expect a reply within a few hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-background ring-1 ring-border">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Request a quote</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
            <span>📍</span>
            <span>{cityName}, {country}</span>
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-neutral-400 hover:text-neutral-600"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-border">
        {/* ── Trip ── */}
        <section className="px-6 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Trip details</p>

          {/* Pickup row */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-600">Pickup</label>
            <div className="grid grid-cols-2 gap-2" lang="en-GB">
              <input
                type="date"
                value={form.pickup_date}
                min={todayStr()}
                onChange={(e) => {
                  const newPickup = e.target.value;
                  set("pickup_date", newPickup);
                  // auto-bump return date if it's no longer after pickup
                  if (form.return_date <= newPickup) {
                    setForm((f) => ({ ...f, pickup_date: newPickup, return_date: addDays(newPickup, 1) }));
                    setErrors((err) => ({ ...err, pickup_date: "", return_date: "" }));
                  }
                }}
                className={inputCls(errors.pickup_date)}
              />
              <input
                type="time"
                value={form.pickup_time}
                onChange={(e) => set("pickup_time", e.target.value)}
                className={inputCls(undefined)}
              />
            </div>
            {errors.pickup_date && <p className="mt-1 text-xs text-red-600">{errors.pickup_date}</p>}
          </div>

          {/* Return row */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-600">Return</label>
            <div className="grid grid-cols-2 gap-2" lang="en-GB">
              <input
                type="date"
                value={form.return_date}
                min={addDays(form.pickup_date, 1)}
                onChange={(e) => set("return_date", e.target.value)}
                className={inputCls(errors.return_date)}
              />
              <input
                type="time"
                value={form.return_time}
                onChange={(e) => set("return_time", e.target.value)}
                className={inputCls(undefined)}
              />
            </div>
            {errors.return_date && <p className="mt-1 text-xs text-red-600">{errors.return_date}</p>}
          </div>

          <Field label="Pickup location" error={errors.pickup_location}>
            <input
              type="text"
              placeholder="Airport, hotel, city centre…"
              value={form.pickup_location}
              onChange={(e) => set("pickup_location", e.target.value)}
              className={inputCls(errors.pickup_location)}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.different_return}
              onChange={(e) => set("different_return", e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand-700 accent-brand-700"
            />
            Different return location
          </label>

          {form.different_return && (
            <Field label="Return location" error={errors.return_location}>
              <input
                type="text"
                placeholder="Return to airport, city…"
                value={form.return_location}
                onChange={(e) => set("return_location", e.target.value)}
                className={inputCls(errors.return_location)}
              />
            </Field>
          )}

          <Field label="Car type">
            <div className="flex flex-wrap gap-2">
              {VEHICLE_TYPES.map((vt) => (
                <button
                  key={vt.key}
                  type="button"
                  onClick={() => set("vehicle_type", vt.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.vehicle_type === vt.key
                      ? "border-brand-700 bg-brand-50 text-brand-900"
                      : "border-border bg-background text-neutral-600 hover:border-brand-300 hover:text-brand-900"
                  }`}
                >
                  {vt.label}
                </button>
              ))}
            </div>
          </Field>

          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.cross_border}
              onChange={(e) => set("cross_border", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-brand-700"
            />
            Cross-border trip
          </label>

          {form.cross_border && (
            <Field label="Destination countries" error={errors.cross_border_countries}>
              <select
                multiple
                size={4}
                value={form.cross_border_countries}
                onChange={(e) =>
                  set(
                    "cross_border_countries",
                    Array.from(e.target.selectedOptions, (o) => o.value)
                  )
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                {EU_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-400">Hold Ctrl/Cmd to select multiple</p>
            </Field>
          )}
        </section>

        {/* ── Driver ── */}
        <section className="px-6 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Driver details</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name" error={errors.customer_name}>
              <input
                type="text"
                placeholder="First and last name"
                value={form.customer_name}
                onChange={(e) => set("customer_name", e.target.value)}
                className={inputCls(errors.customer_name)}
              />
            </Field>
            <Field label="Age" error={errors.driver_age}>
              <input
                type="number"
                placeholder="e.g. 32"
                min={18}
                max={99}
                value={form.driver_age}
                onChange={(e) => set("driver_age", e.target.value)}
                className={inputCls(errors.driver_age)}
              />
            </Field>
          </div>

          <Field label="Phone" error={errors.customer_phone}>
            <input
              type="tel"
              placeholder="+44 7700 900 123"
              value={form.customer_phone}
              onChange={(e) => set("customer_phone", e.target.value)}
              className={inputCls(errors.customer_phone)}
            />
          </Field>

          <Field label="Email" error={errors.customer_email}>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.customer_email}
              onChange={(e) => set("customer_email", e.target.value)}
              className={inputCls(errors.customer_email)}
            />
          </Field>
        </section>

        {/* ── Preferences ── */}
        <section className="px-6 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Preferences</p>

          <Field label="Payment method">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.key}
                  type="button"
                  onClick={() => set("payment_method", pm.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.payment_method === pm.key
                      ? "border-brand-700 bg-brand-50 text-brand-900"
                      : "border-border bg-background text-neutral-600 hover:border-brand-300"
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </Field>

          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.no_deposit}
              onChange={(e) => set("no_deposit", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-brand-700"
            />
            Prefer no deposit / no credit card hold
          </label>
        </section>

        {/* ── Extras ── */}
        <section className="px-6 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Extras</p>

          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.automatic_transmission}
              onChange={(e) => set("automatic_transmission", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-brand-700"
            />
            Automatic transmission
          </label>

          <Field label="Child seats">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set("child_seats", Math.max(0, form.child_seats - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-neutral-600 hover:border-brand-300 hover:text-brand-900 disabled:opacity-30"
                disabled={form.child_seats === 0}
              >
                −
              </button>
              <span className="w-4 text-center text-sm font-medium text-neutral-900">
                {form.child_seats}
              </span>
              <button
                type="button"
                onClick={() => set("child_seats", Math.min(3, form.child_seats + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-neutral-600 hover:border-brand-300 hover:text-brand-900"
              >
                +
              </button>
            </div>
          </Field>

          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.additional_driver}
              onChange={(e) => set("additional_driver", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-brand-700"
            />
            Additional driver
          </label>

          <Field label="Notes (optional)">
            <textarea
              rows={3}
              placeholder="Flight number, special requirements…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
            />
          </Field>
        </section>

        {/* ── Submit ── */}
        <div className="px-6 py-5">
          {serverError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
          >
            {isPending ? "Sending…" : "Send quote request"}
          </button>
          <p className="mt-3 text-center text-xs text-neutral-400">
            We&apos;ll contact {listing.name} with your details and they&apos;ll reach out directly.
          </p>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-neutral-600">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function inputCls(error: string | undefined) {
  return `w-full rounded-xl border px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-colors ${
    error
      ? "border-red-400 focus:border-red-400"
      : "border-border bg-background focus:border-brand-400"
  }`;
}
