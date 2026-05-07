"use client";

import { useState } from "react";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

const FLEET_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "fleet_1_10", label: "1–10 vehicles" },
  { value: "fleet_11_30", label: "11–30 vehicles" },
  { value: "fleet_31_100", label: "31–100 vehicles" },
  { value: "fleet_100_plus", label: "100+ vehicles" },
];

const CITY_OPTIONS = ["Riga", "Tallinn", "Vilnius", "Other"];

export function DemoForm({ id = "demo" }: { id?: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    city: "",
    fleetBucket: "",
    message: "",
    website: "", // honeypot — leave empty
  });
  const [state, setState] = useState<FormState>({ status: "idle" });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "submitting" });

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error ?? "Something went wrong. Please email us instead."
        );
      }

      setState({ status: "success" });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please email us instead.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div
        id={id}
        className="rounded-2xl bg-brand-50 p-8 ring-1 ring-brand-200"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Got it
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-brand-950">
          Thanks — we&apos;ll be in touch within 24 hours.
        </h3>
        <p className="mt-2 text-base leading-7 text-neutral-700">
          We read every request personally. Expect a short reply from{" "}
          <a
            href="mailto:info@carrentdesk.com"
            className="font-medium text-brand-700 hover:underline"
          >
            info@carrentdesk.com
          </a>{" "}
          to schedule a 30-minute walkthrough.
        </p>
      </div>
    );
  }

  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className="grid gap-4 rounded-2xl bg-background p-6 ring-1 ring-border sm:p-8"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Book a 30-min demo
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-brand-950">
          Tell us about your rental.
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          We&apos;ll reply within 24 hours to schedule a walkthrough.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required>
          <input
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Email" required>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Phone (optional)">
          <input
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Rental company name">
          <input
            type="text"
            autoComplete="organization"
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="City">
          <select
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className={inputClass}
          >
            <option value="">Select…</option>
            {CITY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fleet size">
          <select
            value={form.fleetBucket}
            onChange={(e) => update("fleetBucket", e.target.value)}
            className={inputClass}
          >
            <option value="">Select…</option>
            {FLEET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Message (optional)">
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder="What's on your mind? Damage disputes? More customers? Both?"
        />
      </Field>

      {/* Honeypot — bots fill, humans don't see */}
      <label className="sr-only" aria-hidden>
        Website
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </label>

      {state.status === "error" && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-neutral-500">
          We never share your details. Unsubscribe anytime.
        </p>
        <button
          type="submit"
          disabled={state.status === "submitting"}
          className="inline-flex items-center justify-center rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {state.status === "submitting" ? "Sending…" : "Request a demo"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-brand-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-100";
