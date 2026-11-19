"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressSearch } from "@/components/booking/address-search";
import { VehiclePhotos } from "@/app/app/fleet/[companyId]/_components/vehicle-photos";
import { OFFICE_TIME_SLOTS } from "@/lib/booking/dates";
import type { AddressHit } from "@/lib/booking/address";

// ─── Types ────────────────────────────────────────────────────────────────────

type VehicleCategory =
  | "economy" | "compact" | "midsize" | "suv" | "van"
  | "electric" | "cargo" | "luxury" | "other";

const CATEGORIES: { value: VehicleCategory; label: string; emoji: string }[] = [
  { value: "economy",  label: "Small / Economy", emoji: "🚗" },
  { value: "midsize",  label: "Midsize",          emoji: "🚙" },
  { value: "suv",      label: "SUV / Crossover",  emoji: "🚐" },
  { value: "van",      label: "Van / Minivan",     emoji: "🚌" },
  { value: "electric", label: "Electric",          emoji: "⚡" },
  { value: "cargo",    label: "Cargo van",         emoji: "📦" },
];

type CarRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string | null;
  ready: boolean;
};

type AirportRow = {
  code: string;
  name: string;
  enabled: boolean;
  fee: string;
};

type Progress = {
  names: boolean;
  office: boolean;
  places: boolean;
  offer: boolean;
  car: boolean;
  listed: boolean;
};

export type SetupWizardProps = {
  initial: {
    companyId: string;
    citySlug: string;
    cityName: string;
    slug: string;
    listed: boolean;
    step: number;
    // Step 0 — Company
    brandName: string;
    legalName: string;
    description: string;
    phone: string;
    email: string;
    // Step 1 — Office
    office: (AddressHit & { alwaysOpen: boolean; opensAt: string; closesAt: string }) | null;
    // Step 2 — Pickup
    officePickup: boolean;
    officeFee: string;
    cityDeliveryEnabled: boolean;
    cityDeliveryPrice: string;
    airports: AirportRow[];
    // Step 3 — Payment methods (company-wide)
    payCash: boolean;
    payCard: boolean;
    payCreditCard: boolean;
    depositCash: boolean;
    depositCard: boolean;
    // Cars
    cars: CarRow[];
    progress: Progress;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
  return json;
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-neutral-700">{children}</label>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm " +
        "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 " +
        (props.className ?? "")
      }
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={
        "mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm resize-none " +
        "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 " +
        (props.className ?? "")
      }
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
    >
      <span
        className={
          "mt-0.5 flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors " +
          (checked ? "bg-brand-600" : "bg-neutral-300")
        }
      >
        <span
          className={
            "h-4 w-4 rounded-full bg-white shadow transition-transform " +
            (checked ? "translate-x-4" : "translate-x-0.5")
          }
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-neutral-900">{label}</span>
        {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
      </span>
    </button>
  );
}

function FeeToggle({
  free,
  onToggle,
  fee,
  onFee,
  freeLabel = "Free",
  feeLabel = "Set fee (€)",
}: {
  free: boolean;
  onToggle: (v: boolean) => void;
  fee: string;
  onFee: (v: string) => void;
  freeLabel?: string;
  feeLabel?: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={
          "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors " +
          (free
            ? "border-brand-600 bg-brand-50 text-brand-700"
            : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50")
        }
      >
        {freeLabel}
      </button>
      <button
        type="button"
        onClick={() => { onToggle(false); onFee(""); }}
        className={
          "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors " +
          (!free
            ? "border-brand-600 bg-brand-50 text-brand-700"
            : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50")
        }
      >
        {feeLabel}
      </button>
      {!free && (
        <Input
          type="number"
          min="0"
          step="1"
          value={fee}
          onChange={(e) => onFee(e.target.value)}
          placeholder="Enter fee"
          className="w-28"
        />
      )}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
      />
      <span>
        <span className="block text-sm font-medium text-neutral-900">{label}</span>
        {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">{children}</h3>;
}

function SaveButton({
  saving,
  label = "Continue",
  disabled,
}: {
  saving: boolean;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
    >
      {saving ? "Saving…" : label}
    </button>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {msg}
    </div>
  );
}

// ─── Sidebar progress ─────────────────────────────────────────────────────────

const STEP_LABELS = ["Company", "Office", "Pickup", "First car", "Go live"];

function Sidebar({ step, progress }: { step: number; progress: Progress }) {
  const done = [
    progress.names,
    progress.office,
    progress.places,
    progress.car && progress.offer,
    progress.listed,
  ];
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto pb-1 md:mb-0 md:flex-col md:gap-2">
      {STEP_LABELS.map((label, i) => {
        const isActive = i === step;
        const isDone = done[i];
        return (
          <div
            key={label}
            className={
              "flex min-w-[90px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors md:min-w-0 " +
              (isActive
                ? "bg-brand-50 text-brand-700"
                : isDone
                ? "text-neutral-500"
                : "text-neutral-400")
            }
          >
            <span
              className={
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                (isActive
                  ? "bg-brand-600 text-white"
                  : isDone
                  ? "bg-neutral-200 text-neutral-500"
                  : "border border-neutral-300 text-neutral-400")
              }
            >
              {isDone && !isActive ? "✓" : i + 1}
            </span>
            <span className="hidden md:inline">{label}</span>
          </div>
        );
      })}
    </nav>
  );
}

// ─── Step 0: Company ──────────────────────────────────────────────────────────

function StepCompany({
  initial,
  companyId,
  onDone,
}: {
  initial: SetupWizardProps["initial"];
  companyId: string;
  onDone: (draft: Step0Draft) => void;
}) {
  const [brandName, setBrandName] = useState(initial.brandName);
  const [legalName, setLegalName] = useState(initial.legalName);
  const [description, setDescription] = useState(initial.description);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await post({ step: "names", companyId, brandName, legalName, description, phone, email });
      onDone({ brandName, legalName, description, phone, email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Brand name <span className="text-red-500">*</span></Label>
        <Input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="e.g. Sunny Cars Riga"
          required
        />
        <p className="mt-1 text-xs text-neutral-500">The name customers see on your listing page.</p>
      </div>

      <div>
        <Label>Legal company name <span className="text-red-500">*</span></Label>
        <Input
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="e.g. SIA Sunny Cars"
          required
        />
        <p className="mt-1 text-xs text-neutral-500">Used on invoices. Not shown to customers.</p>
      </div>

      <div>
        <Label>Short description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. English-speaking rental based in Riga city centre. Free airport transfers."
          maxLength={280}
        />
        <p className="mt-1 text-xs text-neutral-500">
          Up to 280 characters. Shown on your listing page.
        </p>
      </div>

      <div>
        <Label>Phone / WhatsApp <span className="text-red-500">*</span></Label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+371 20 000 000"
          required
        />
      </div>

      <div>
        <Label>Email <span className="text-red-500">*</span></Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@yourcompany.com"
          required
        />
      </div>

      {error && <ErrorBox msg={error} />}
      <SaveButton saving={saving} />
    </form>
  );
}

// ─── Step 1: Office ───────────────────────────────────────────────────────────

function StepOffice({
  initial,
  companyId,
  onBack,
  onDone,
}: {
  initial: SetupWizardProps["initial"];
  companyId: string;
  onBack: (office: (AddressHit & { alwaysOpen: boolean; opensAt: string; closesAt: string }) | null) => void;
  onDone: () => void;
}) {
  const [office, setOffice] = useState<AddressHit | null>(
    initial.office ? { label: initial.office.label, lat: initial.office.lat, lng: initial.office.lng } : null,
  );
  const [alwaysOpen, setAlwaysOpen] = useState(initial.office?.alwaysOpen ?? false);
  const [opensAt, setOpensAt] = useState(initial.office?.opensAt ?? "09:00");
  const [closesAt, setClosesAt] = useState(initial.office?.closesAt ?? "18:00");

  function currentOfficeDraft() {
    if (!office) return null;
    return { label: office.label, lat: office.lat, lng: office.lng, alwaysOpen, opensAt, closesAt };
  }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!office) { setError("Choose the office address from the search results."); return; }
    setError("");
    setSaving(true);
    try {
      await post({
        step: "office",
        companyId,
        address: office.label,
        lat: office.lat,
        lng: office.lng,
        alwaysOpen,
        opensAt,
        closesAt,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label>Office address <span className="text-red-500">*</span></Label>
        <div className="mt-1">
          <AddressSearch
            citySlug={initial.citySlug}
            cityName={initial.cityName}
            label="Office address"
            initial={initial.office ? { label: initial.office.label, lat: initial.office.lat, lng: initial.office.lng } : null}
            onSelect={(hit) => setOffice(hit)}
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Your office or parking location. Shown on the map.
        </p>
      </div>

      <div>
        <Toggle
          checked={alwaysOpen}
          onChange={setAlwaysOpen}
          label="24/7 — always open"
          hint="Your rental accepts pickups and returns at any hour."
        />
      </div>

      {!alwaysOpen && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Opens at</Label>
            <select
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {OFFICE_TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Closes at</Label>
            <select
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {OFFICE_TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <ErrorBox msg={error} />}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onBack(currentOfficeDraft())}
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

// ─── Step 2: Pickup ───────────────────────────────────────────────────────────

type AirportState = { code: string; name: string; enabled: boolean; free: boolean; fee: string };

function StepPickup({
  initial,
  airports: airportsProp,
  companyId,
  onBack,
  onDone,
}: {
  initial: SetupWizardProps["initial"];
  airports?: AirportState[];
  companyId: string;
  onBack: (d: Step2Draft) => void;
  onDone: () => void;
}) {
  const [officePickup, setOfficePickup] = useState(initial.officePickup);
  const [officeFree, setOfficeFree] = useState(
    !initial.officeFee || initial.officeFee === "0",
  );
  const [officeFee, setOfficeFee] = useState(initial.officeFee || "0");

  const [cityDelivery, setCityDelivery] = useState(initial.cityDeliveryEnabled);
  const [cityFree, setCityFree] = useState(
    !initial.cityDeliveryPrice || initial.cityDeliveryPrice === "0",
  );
  const [cityFee, setCityFee] = useState(initial.cityDeliveryPrice || "0");

  const [airports, setAirports] = useState<AirportState[]>(() =>
    airportsProp ??
    initial.airports.map((a) => ({
      ...a,
      free: !a.fee || a.fee === "0",
      fee: a.fee || "0",
    })),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setAirport(code: string, patch: Partial<AirportState>) {
    setAirports((prev) => prev.map((a) => (a.code === code ? { ...a, ...patch } : a)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await post({
        step: "places",
        companyId,
        officePickup,
        officeFee: officeFree ? "0" : officeFee,
        cityDeliveryEnabled: cityDelivery,
        cityDeliveryPrice: cityDelivery ? (cityFree ? "0" : cityFee) : "0",
        airports: airports.map((a) => ({
          code: a.code,
          enabled: a.enabled,
          fee: a.enabled ? (a.free ? "0" : a.fee) : "0",
        })),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Office pickup */}
      <div>
        <SectionTitle>Office pickup</SectionTitle>
        <Toggle
          checked={officePickup}
          onChange={setOfficePickup}
          label="Customers can pick up and return at your office"
        />
        {officePickup && (
          <FeeToggle
            free={officeFree}
            onToggle={setOfficeFree}
            fee={officeFee}
            onFee={setOfficeFee}
          />
        )}
      </div>

      {/* City delivery */}
      <div>
        <SectionTitle>City delivery</SectionTitle>
        <Toggle
          checked={cityDelivery}
          onChange={setCityDelivery}
          label={`Deliver anywhere in ${initial.cityName}`}
          hint="You drive the car to the customer's address."
        />
        {cityDelivery && (
          <FeeToggle
            free={cityFree}
            onToggle={setCityFree}
            fee={cityFee}
            onFee={setCityFee}
          />
        )}
      </div>

      {/* Airports */}
      {airports.length > 0 && (
        <div>
          <SectionTitle>Airports</SectionTitle>
          <p className="mb-2 text-xs text-neutral-500">
            Auto-detected for {initial.cityName}. Enable the ones you serve.
          </p>
          <div className="space-y-2">
            {airports.map((airport) => (
              <div key={airport.code} className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-neutral-900">{airport.name}</span>
                    <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-neutral-600">
                      {airport.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAirport(airport.code, { enabled: !airport.enabled })}
                    className={
                      "flex h-6 w-11 items-center rounded-full transition-colors " +
                      (airport.enabled ? "bg-brand-600" : "bg-neutral-300")
                    }
                  >
                    <span
                      className={
                        "h-5 w-5 rounded-full bg-white shadow transition-transform " +
                        (airport.enabled ? "translate-x-5" : "translate-x-0.5")
                      }
                    />
                  </button>
                </div>
                {airport.enabled && (
                  <FeeToggle
                    free={airport.free}
                    onToggle={(v) => setAirport(airport.code, { free: v })}
                    fee={airport.fee}
                    onFee={(v) => setAirport(airport.code, { fee: v })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <ErrorBox msg={error} />}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onBack({ officePickup, officeFree, officeFee, cityDelivery, cityFree, cityFee, airports })}
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <SaveButton saving={saving} />
      </div>
    </form>
  );
}

// ─── Step 3: First car + payment ──────────────────────────────────────────────

type CarFormState = {
  category: VehicleCategory;
  make: string;
  model: string;
  year: string;
  plate: string;
  alwaysAvailable: boolean;
  rate1Day: string;
  rateWeekly: string;
  rateMonthly: string;
  depositBasic: string;
  fullInsuranceEnabled: boolean;
  fullInsurancePrice: string;
};

function emptyCarForm(): CarFormState {
  return {
    category: "economy",
    make: "",
    model: "",
    year: "",
    plate: "",
    alwaysAvailable: false,
    rate1Day: "",
    rateWeekly: "",
    rateMonthly: "",
    depositBasic: "",
    fullInsuranceEnabled: false,
    fullInsurancePrice: "",
  };
}

function StepCar({
  initial,
  companyId,
  onBack,
  onDone,
}: {
  initial: SetupWizardProps["initial"];
  companyId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [cars, setCars] = useState<CarRow[]>(initial.cars);
  const [form, setForm] = useState<CarFormState>(emptyCarForm());
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [addingCar, setAddingCar] = useState(cars.length === 0);
  const [carSaving, setCarSaving] = useState(false);
  const [carError, setCarError] = useState("");

  // Company-wide payment options
  const [payCash, setPayCash] = useState(initial.payCash);
  const [payCard, setPayCard] = useState(initial.payCard);
  const [payCreditCard, setPayCreditCard] = useState(initial.payCreditCard);
  const [depositCash, setDepositCash] = useState(initial.depositCash);
  const [depositCard, setDepositCard] = useState(initial.depositCard);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field<K extends keyof CarFormState>(key: K, value: CarFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function addCar(e: React.FormEvent) {
    e.preventDefault();
    setCarError("");
    setCarSaving(true);
    try {
      const result = await post({
        step: "car",
        companyId,
        category: form.category,
        make: form.make,
        model: form.model,
        year: Number(form.year),
        plate: form.plate,
        alwaysAvailable: form.alwaysAvailable,
        rate1Day: Number(form.rate1Day),
        rateWeekly: form.rateWeekly ? Number(form.rateWeekly) : null,
        rateMonthly: form.rateMonthly ? Number(form.rateMonthly) : null,
        depositBasic: Number(form.depositBasic),
        fullInsuranceEnabled: form.fullInsuranceEnabled,
        fullInsurancePrice: form.fullInsuranceEnabled ? Number(form.fullInsurancePrice) : null,
        photoUrls,
      });
      setCars((prev) => [...prev, result.car]);
      setForm(emptyCarForm());
      setPhotoUrls([]);
      setAddingCar(false);
    } catch (err) {
      setCarError(err instanceof Error ? err.message : "Could not add the car.");
    } finally {
      setCarSaving(false);
    }
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await post({
        step: "offer",
        companyId,
        payCash,
        payCard,
        payCreditCard,
        depositCash,
        depositCard,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const hasCar = cars.length > 0;
  const catEmoji = (c: string) => CATEGORIES.find((x) => x.value === c)?.emoji ?? "🚗";

  return (
    <div className="space-y-6">
      {/* Saved cars list */}
      {cars.length > 0 && (
        <div className="space-y-2">
          {cars.map((car) => (
            <div
              key={car.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
            >
              <span className="text-xl">{catEmoji((car as CarRow & { category?: string }).category ?? "economy")}</span>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {car.year} {car.make} {car.model}
                </p>
                {car.plate && <p className="text-xs text-neutral-500">{car.plate}</p>}
              </div>
              {car.ready && (
                <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Ready
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add car form */}
      {addingCar ? (
        <form onSubmit={addCar} className="rounded-xl border border-brand-100 bg-brand-50/30 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-800">
            {cars.length === 0 ? "Add your first car" : "Add another car"}
          </h3>

          {/* Category */}
          <div>
            <Label>Category <span className="text-red-500">*</span></Label>
            <select
              value={form.category}
              onChange={(e) => field("category", e.target.value as VehicleCategory)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Make / Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Make <span className="text-red-500">*</span></Label>
              <Input
                value={form.make}
                onChange={(e) => field("make", e.target.value)}
                placeholder="Toyota"
                required
              />
            </div>
            <div>
              <Label>Model <span className="text-red-500">*</span></Label>
              <Input
                value={form.model}
                onChange={(e) => field("model", e.target.value)}
                placeholder="Corolla"
                required
              />
            </div>
          </div>

          {/* Year / Plate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Year <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => field("year", e.target.value)}
                placeholder="2022"
                min="1980"
                max={String(new Date().getFullYear() + 1)}
                required
              />
            </div>
            <div>
              <Label>Plate <span className="text-neutral-400 text-xs">(optional)</span></Label>
              <Input
                value={form.plate}
                onChange={(e) => field("plate", e.target.value)}
                placeholder="AA-0000"
              />
              <p className="mt-0.5 text-xs text-neutral-400">Not shown to customers.</p>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <SectionTitle>Rental price</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Per day (€) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={form.rate1Day}
                  onChange={(e) => field("rate1Day", e.target.value)}
                  placeholder="45"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <Label>Per week (€)</Label>
                <Input
                  type="number"
                  value={form.rateWeekly}
                  onChange={(e) => field("rateWeekly", e.target.value)}
                  placeholder="250"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <Label>Per month (€)</Label>
                <Input
                  type="number"
                  value={form.rateMonthly}
                  onChange={(e) => field("rateMonthly", e.target.value)}
                  placeholder="800"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div>
            <SectionTitle>Insurance &amp; deposit</SectionTitle>
            <div>
              <Label>Deposit with basic insurance (€) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={form.depositBasic}
                onChange={(e) => field("depositBasic", e.target.value)}
                placeholder="300"
                min="0"
                step="1"
                required
              />
              <p className="mt-1 text-xs text-neutral-500">
                Basic insurance always included. This is the security deposit amount.
              </p>
            </div>
            <div className="mt-3">
              <Toggle
                checked={form.fullInsuranceEnabled}
                onChange={(v) => field("fullInsuranceEnabled", v)}
                label="Offer full insurance (no deposit)"
                hint="Customer pays extra per day — no excess or deposit."
              />
              {form.fullInsuranceEnabled && (
                <div className="mt-2">
                  <Label>Full insurance price per day (€) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={form.fullInsurancePrice}
                    onChange={(e) => field("fullInsurancePrice", e.target.value)}
                    placeholder="15"
                    min="0"
                    step="1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Always available */}
          <div>
            <Toggle
              checked={form.alwaysAvailable}
              onChange={(v) => field("alwaysAvailable", v)}
              label="This car is always available"
              hint="If it's booked on the customer's dates, I'll offer an equal or better option."
            />
          </div>

          {/* Photos */}
          <div>
            <Label>Photos <span className="text-red-500">*</span></Label>
            <p className="mb-2 text-xs text-neutral-500">Add at least one photo. Customers see these.</p>
            <VehiclePhotos
              companyId={companyId}
              allowDraft={true}
              urls={photoUrls}
              onChange={setPhotoUrls}
            />
          </div>

          {carError && <ErrorBox msg={carError} />}

          <div className="flex gap-2">
            {cars.length > 0 && (
              <button
                type="button"
                onClick={() => setAddingCar(false)}
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={carSaving}
              className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {carSaving ? "Saving…" : "Save car"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCar(true)}
          className="w-full rounded-xl border-2 border-dashed border-neutral-300 py-4 text-sm font-medium text-neutral-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          + Add another car
        </button>
      )}

      {/* Company-wide payment options — shown after first car is saved */}
      {hasCar && !addingCar && (
        <form onSubmit={handleContinue} className="space-y-6 border-t border-neutral-200 pt-6">
          <div>
            <SectionTitle>How the customer pays you at pickup</SectionTitle>
            <p className="mb-3 text-xs text-neutral-500">
              Customer pays you the full rental at pickup. We take nothing.
            </p>
            <div className="space-y-2">
              <Checkbox checked={payCash} onChange={setPayCash} label="Cash" />
              <Checkbox checked={payCreditCard} onChange={setPayCreditCard} label="Credit card" />
              <Checkbox checked={payCard} onChange={setPayCard} label="Debit card" />
            </div>
          </div>

          <div>
            <SectionTitle>How the deposit is taken</SectionTitle>
            <div className="space-y-2">
              <Checkbox
                checked={depositCard}
                onChange={setDepositCard}
                label="Credit card pre-authorisation"
                hint="Most common. Card is blocked but not charged."
              />
              <Checkbox
                checked={depositCash}
                onChange={setDepositCash}
                label="Cash deposit"
                hint="You hold the cash and return it on car return."
              />
            </div>
          </div>

          {error && <ErrorBox msg={error} />}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Back
            </button>
            <SaveButton saving={saving} label="Continue to preview" />
          </div>
        </form>
      )}

      {!hasCar && !addingCar && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Go live ──────────────────────────────────────────────────────────

function StepLive({
  initial,
  companyId,
  onBack,
  onDone,
}: {
  initial: SetupWizardProps["initial"];
  companyId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const checks = [
    { label: "Company details", done: initial.progress.names },
    { label: "Office address", done: initial.progress.office },
    { label: "Pickup options", done: initial.progress.places },
    { label: "First car with photos & price", done: initial.progress.car },
    { label: "Payment options", done: initial.progress.offer },
  ];
  const allDone = checks.every((c) => c.done);

  async function goLive() {
    setError("");
    setSaving(true);
    try {
      await post({ step: "live", companyId });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not go live.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Preview card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {initial.cityName}
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-neutral-900">
              {initial.brandName || "Your rental name"}
            </h2>
            {initial.description && (
              <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{initial.description}</p>
            )}
            <p className="mt-2 text-sm text-neutral-500">
              {initial.cars.length} car{initial.cars.length !== 1 ? "s" : ""} listed
            </p>
          </div>
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-3xl">
            🚗
          </div>
        </div>
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <p className="text-xs text-neutral-500">
            Your listing will appear at{" "}
            <span className="font-mono text-brand-700">
              carrentdesk.com/{initial.citySlug}/{initial.slug}
            </span>
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <SectionTitle>Before you go live</SectionTitle>
        <div className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.label}
              className={
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm " +
                (check.done
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-neutral-200 bg-white text-neutral-500")
              }
            >
              <span className={check.done ? "text-green-600" : "text-neutral-300"}>
                {check.done ? "✓" : "○"}
              </span>
              {check.label}
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorBox msg={error} />}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={goLive}
          disabled={saving || !allDone}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Publishing…" : "Go live 🚀"}
        </button>
      </div>

      {!allDone && (
        <p className="text-center text-xs text-neutral-400">
          Complete all steps above to publish your rental.
        </p>
      )}
    </div>
  );
}

// ─── Root Wizard ──────────────────────────────────────────────────────────────

// ─── Draft state (preserves form data when going back) ───────────────────────

type Step0Draft = { brandName: string; legalName: string; description: string; phone: string; email: string };
type Step1Draft = { office: (AddressHit & { alwaysOpen: boolean; opensAt: string; closesAt: string }) | null };
type Step2Draft = {
  officePickup: boolean; officeFree: boolean; officeFee: string;
  cityDelivery: boolean; cityFree: boolean; cityFee: string;
  airports: AirportState[];
};

type Drafts = {
  0?: Step0Draft;
  1?: Step1Draft;
  2?: Step2Draft;
};

export function SetupWizard({ initial }: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(initial.step);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [drafts, setDrafts] = useState<Drafts>({});

  function saveDraft<K extends keyof Drafts>(stepIdx: K, data: Drafts[K]) {
    setDrafts((prev) => ({ ...prev, [stepIdx]: data }));
  }

  function advance(nextStep: number, progressPatch: Partial<Progress> = {}) {
    setProgress((prev) => ({ ...prev, ...progressPatch }));
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (initial.listed && step === 4) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-xl font-bold text-green-800">You are live!</h2>
        <p className="mt-2 text-sm text-green-700">
          Your rental is on{" "}
          <a
            href={`/${initial.citySlug}/${initial.slug}`}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            carrentdesk.com/{initial.citySlug}/{initial.slug}
          </a>
        </p>
        <button
          type="button"
          onClick={() => router.push("/app/dashboard")}
          className="mt-5 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  const updatedInitial: SetupWizardProps["initial"] = {
    ...initial,
    progress,
    // Merge drafts so going back restores what was typed
    ...(drafts[0] ?? {}),
    office: drafts[1]?.office !== undefined ? drafts[1].office : initial.office,
    ...(drafts[2]
      ? {
          officePickup: drafts[2].officePickup,
          officeFee: drafts[2].officeFree ? "0" : drafts[2].officeFee,
          cityDeliveryEnabled: drafts[2].cityDelivery,
          cityDeliveryPrice: drafts[2].cityFree ? "0" : drafts[2].cityFee,
        }
      : {}),
  };

  return (
    <div className="md:flex md:gap-8">
      <div className="md:w-40 md:flex-shrink-0">
        <Sidebar step={step} progress={progress} />
      </div>

      <div className="mt-6 flex-1 md:mt-0">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-neutral-900">{STEP_LABELS[step]}</h1>
          <p className="mt-1 text-sm text-neutral-500">Step {step + 1} of {STEP_LABELS.length}</p>
        </div>

        {step === 0 && (
          <StepCompany
            initial={updatedInitial}
            companyId={initial.companyId}
            onDone={(d) => { saveDraft(0, d); advance(1, { names: true }); }}
          />
        )}
        {step === 1 && (
          <StepOffice
            initial={updatedInitial}
            companyId={initial.companyId}
            onBack={(d) => { saveDraft(1, { office: d }); setStep(0); }}
            onDone={() => advance(2, { office: true })}
          />
        )}
        {step === 2 && (
          <StepPickup
            initial={updatedInitial}
            airports={drafts[2]?.airports}
            companyId={initial.companyId}
            onBack={(d) => { saveDraft(2, d); setStep(1); }}
            onDone={() => advance(3, { places: true })}
          />
        )}
        {step === 3 && (
          <StepCar
            initial={updatedInitial}
            companyId={initial.companyId}
            onBack={() => setStep(2)}
            onDone={() => advance(4, { car: true, offer: true })}
          />
        )}
        {step === 4 && (
          <StepLive
            initial={updatedInitial}
            companyId={initial.companyId}
            onBack={() => setStep(3)}
            onDone={() => {
              advance(4, { listed: true });
              router.push("/app/dashboard");
            }}
          />
        )}
      </div>
    </div>
  );
}
