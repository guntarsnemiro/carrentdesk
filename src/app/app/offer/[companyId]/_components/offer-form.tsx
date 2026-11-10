"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { CROSS_BORDER_COUNTRIES } from "@/lib/booking/countries";
import { OFFICE_TIME_SLOTS } from "@/lib/booking/dates";
import type { FuelPolicy, InsuranceCode, PriceKind } from "@/lib/booking/offer";

export type PlaceDraft = {
  id: string;
  name: string;
  address: string;
  pickupAllowed: boolean;
  returnAllowed: boolean;
  deliveryFee: string;
  opensAt: string;
  closesAt: string;
  afterHoursFee: string;
};

export type InsuranceDraft = {
  code: InsuranceCode;
  label: string;
  price: string;
  priceKind: PriceKind;
  excess: string;
};

export type OfferDraft = {
  depositPayCash: boolean;
  depositPayCard: boolean;
  depositReturnedWhen: string;
  creditCardRequired: boolean;
  payCash: boolean;
  payCard: boolean;
  payTransfer: boolean;
  minDriverAge: string;
  unlimitedKm: boolean;
  kmPerDay: string;
  extraKmPrice: string;
  fuelPolicy: FuelPolicy;
  minRentalDays: string;
  oneWayFee: string;
  pricesIncludeVat: boolean;
  crossBorderAllowed: boolean;
  crossBorderPricePerDay: string;
  crossBorderMaxPrice: string;
  crossBorderCountries: string[];
  childSeatPricePerDay: string;
  childSeatMaxPrice: string;
  additionalDriverPricePerDay: string;
  additionalDriverMaxPrice: string;
  gpsPricePerDay: string;
  gpsMaxPrice: string;
  airportDeliveryPricePerDay: string;
  airportDeliveryMaxPrice: string;
  cityDeliveryEnabled: boolean;
  cityDeliveryPrice: string;
  insurance: InsuranceDraft[];
  places: PlaceDraft[];
  airports: AirportDraft[];
};

export type AirportDraft = {
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  enabled: boolean;
  locationId: string | null;
  opensAt: string;
  closesAt: string;
  fee: string;
  afterHoursFee: string;
};

export type OfferFormProps = {
  companyId: string;
  cityName: string;
  initial: OfferDraft;
};

const inp = "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-brand-500";

function optionalMoney(value: string, label: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a number, or left blank.`);
  return Math.round(n * 100) / 100;
}

function requiredMoney(value: string, label: string): number {
  const n = optionalMoney(value, label);
  if (n == null) throw new Error(`${label} is required. Use 0 if it is free.`);
  return n;
}

function optionalInt(value: string, label: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${label} must be a whole number, or left blank.`);
  return n;
}

export function OfferForm({ companyId, cityName, initial }: OfferFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<OfferDraft>(initial);
  const [removedPlaceIds, setRemovedPlaceIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  function set<K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  }

  function updatePlace(id: string, patch: Partial<PlaceDraft>) {
    setForm((prev) => ({
      ...prev,
      places: prev.places.map((place) => (place.id === id ? { ...place, ...patch } : place)),
    }));
    setStatus("idle");
  }

  function updateInsurance(code: InsuranceCode, patch: Partial<InsuranceDraft>) {
    setForm((prev) => ({
      ...prev,
      insurance: prev.insurance.map((row) => (row.code === code ? { ...row, ...patch } : row)),
    }));
    setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const minDriverAge = optionalInt(form.minDriverAge, "Minimum driver age");
      if (minDriverAge == null || minDriverAge < 18 || minDriverAge > 99) {
        throw new Error("Minimum driver age must be between 18 and 99.");
      }
      const crossBorderPerDay = optionalMoney(form.crossBorderPricePerDay, "Cross-border daily price");
      const crossBorderMax = optionalMoney(form.crossBorderMaxPrice, "Cross-border total");
      if (form.crossBorderAllowed && crossBorderPerDay == null && crossBorderMax == null) {
        throw new Error("Cross-border needs a daily price, a total for the rental, or both.");
      }
      if (form.crossBorderAllowed && form.crossBorderCountries.length === 0) {
        throw new Error("Choose at least one country for cross-border travel.");
      }
      const minRentalDays = optionalInt(form.minRentalDays, "Minimum rental length") ?? 1;
      if (minRentalDays < 1) throw new Error("Minimum rental length must be at least 1 day.");
      if (!form.unlimitedKm && !form.kmPerDay.trim()) {
        throw new Error("Enter the kilometres included per day, or tick unlimited kilometres.");
      }

      for (const place of form.places) {
        if (!place.address.trim()) throw new Error("Every place needs an address.");
      }
      if (form.cityDeliveryEnabled && !form.cityDeliveryPrice.trim()) {
        throw new Error(`Enter the ${cityName} delivery price. Use 0 if it is free.`);
      }

      const supabase = getAuthBrowserClient();
      const childSeatPerDay = optionalMoney(form.childSeatPricePerDay, "Child seat daily price");
      const childSeatMax = optionalMoney(form.childSeatMaxPrice, "Child seat total");
      const driverPerDay = optionalMoney(form.additionalDriverPricePerDay, "Additional driver daily price");
      const driverMax = optionalMoney(form.additionalDriverMaxPrice, "Additional driver total");
      const gpsPerDay = optionalMoney(form.gpsPricePerDay, "GPS daily price");
      const gpsMax = optionalMoney(form.gpsMaxPrice, "GPS total");
      const airportPerDay = optionalMoney(form.airportDeliveryPricePerDay, "Airport delivery daily price");
      const airportMax = optionalMoney(form.airportDeliveryMaxPrice, "Airport delivery total");
      const { error: offerError } = await supabase.from("company_booking_offers").upsert({
        company_id: companyId,
        deposit_pay_cash: form.depositPayCash,
        deposit_pay_card: form.creditCardRequired ? true : form.depositPayCard,
        deposit_returned_when: form.depositReturnedWhen.trim() || null,
        credit_card_required: form.creditCardRequired,
        pay_cash: form.payCash,
        pay_card: form.creditCardRequired ? true : form.payCard,
        pay_transfer: form.payTransfer,
        min_driver_age: minDriverAge,
        unlimited_km: form.unlimitedKm,
        km_per_day: form.unlimitedKm ? null : optionalInt(form.kmPerDay, "Kilometres per day"),
        extra_km_price: form.unlimitedKm ? null : optionalMoney(form.extraKmPrice, "Extra kilometre price"),
        fuel_policy: form.fuelPolicy,
        min_rental_days: minRentalDays,
        one_way_fee: optionalMoney(form.oneWayFee, "One-way fee"),
        prices_include_vat: form.pricesIncludeVat,
        cross_border_allowed: form.crossBorderAllowed,
        cross_border_price_per_day: crossBorderPerDay,
        cross_border_max_price: crossBorderMax,
        cross_border_price: crossBorderPerDay ?? crossBorderMax,
        cross_border_price_kind: crossBorderPerDay != null ? "per_day" : "flat",
        cross_border_countries: form.crossBorderCountries,
        child_seat_price_per_day: childSeatPerDay,
        child_seat_max_price: childSeatMax,
        additional_driver_price_per_day: driverPerDay,
        additional_driver_max_price: driverMax,
        gps_price_per_day: gpsPerDay,
        gps_max_price: gpsMax,
        airport_delivery_price_per_day: airportPerDay,
        airport_delivery_max_price: airportMax,
        airport_delivery_price: airportMax ?? airportPerDay,
        city_delivery_enabled: form.cityDeliveryEnabled,
        city_delivery_price: form.cityDeliveryEnabled ? optionalMoney(form.cityDeliveryPrice, "City delivery price") : null,
        updated_at: new Date().toISOString(),
      });
      if (offerError) throw new Error(offerError.message);

      const { error: insuranceError } = await supabase.from("company_insurance_options").upsert(
        form.insurance.map((row) => ({
          company_id: companyId,
          code: row.code,
          label: row.label.trim() || row.code,
          price: requiredMoney(row.code === "none" ? "0" : row.price, `${row.label} price`),
          price_kind: row.priceKind,
          excess: 0,
        })),
        { onConflict: "company_id,code" },
      );
      if (insuranceError) throw new Error(insuranceError.message);
      await supabase.from("company_insurance_options").delete().eq("company_id", companyId).eq("code", "partial");

      for (const place of form.places) {
        const payload = {
          company_id: companyId,
          kind: "office",
          iata_code: null,
          name: place.name.trim() || null,
          address: place.address.trim(),
          pickup_allowed: place.pickupAllowed,
          return_allowed: place.returnAllowed,
          delivery_fee: optionalMoney(place.deliveryFee, "Delivery fee"),
          opens_at: place.opensAt || null,
          closes_at: place.closesAt || null,
          after_hours_fee: optionalMoney(place.afterHoursFee, "After-hours fee"),
        };
        if (place.id.startsWith("new:")) {
          const { error: insertError } = await supabase.from("locations").insert(payload);
          if (insertError) throw new Error(insertError.message);
        } else {
          const { error: updateError } = await supabase.from("locations").update(payload).eq("id", place.id).eq("company_id", companyId);
          if (updateError) throw new Error(updateError.message);
        }
      }
      for (const airport of form.airports) {
        if (!airport.enabled && !airport.locationId) continue;
        const payload = {
          company_id: companyId,
          kind: "airport",
          iata_code: airport.code,
          name: airport.name,
          address: airport.address,
          lat: airport.lat,
          lng: airport.lng,
          pickup_allowed: airport.enabled,
          return_allowed: airport.enabled,
          delivery_fee: optionalMoney(airport.fee, `${airport.code} fee`),
          opens_at: airport.opensAt || null,
          closes_at: airport.closesAt || null,
          after_hours_fee: optionalMoney(airport.afterHoursFee, `${airport.code} after-hours fee`),
        };
        if (airport.locationId) {
          const { error: updateError } = await supabase.from("locations").update(payload).eq("id", airport.locationId).eq("company_id", companyId);
          if (updateError) throw new Error(updateError.message);
        } else {
          const { error: insertError } = await supabase.from("locations").insert(payload);
          if (insertError) throw new Error(insertError.message);
        }
      }
      for (const id of removedPlaceIds) {
        const { error: deleteError } = await supabase.from("locations").delete().eq("id", id).eq("company_id", companyId);
        if (deleteError) throw new Error(deleteError.message);
      }
      setRemovedPlaceIds([]);
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not save the offer.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Places" hint="Where a customer can pick up, return, or have the car delivered. A delivery fee is added when they pick up at that place.">
        <div className="space-y-4">
          {form.places.map((place) => (
            <div key={place.id} className="rounded-xl border border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-neutral-500">Name
                  <input value={place.name} onChange={(e) => updatePlace(place.id, { name: e.target.value })} className={inp} placeholder="Office" />
                </label>
                <label className="block text-xs font-medium text-neutral-500">Address
                  <input value={place.address} onChange={(e) => updatePlace(place.id, { address: e.target.value })} className={inp} placeholder="Street, city" />
                </label>
                <TimeField label="Opens" value={place.opensAt} onChange={(opensAt) => updatePlace(place.id, { opensAt })} />
                <TimeField label="Closes" value={place.closesAt} onChange={(closesAt) => updatePlace(place.id, { closesAt })} />
                <label className="block text-xs font-medium text-neutral-500">Delivery fee (€)
                  <input value={place.deliveryFee} onChange={(e) => updatePlace(place.id, { deliveryFee: e.target.value })} className={inp} placeholder="Blank if no delivery fee" />
                </label>
                <label className="block text-xs font-medium text-neutral-500">After-hours fee (€)
                  <input value={place.afterHoursFee} onChange={(e) => updatePlace(place.id, { afterHoursFee: e.target.value })} className={inp} placeholder="Blank if closed outside hours" />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Check label="Pickup" checked={place.pickupAllowed} onChange={(pickupAllowed) => updatePlace(place.id, { pickupAllowed })} />
                <Check label="Return" checked={place.returnAllowed} onChange={(returnAllowed) => updatePlace(place.id, { returnAllowed })} />
                <button
                  type="button"
                  className="ml-auto text-sm text-red-700 hover:underline"
                  onClick={() => {
                    if (!place.id.startsWith("new:")) setRemovedPlaceIds((ids) => [...ids, place.id]);
                    setForm((prev) => ({ ...prev, places: prev.places.filter((item) => item.id !== place.id) }));
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-brand-800 hover:underline"
            onClick={() => setForm((prev) => ({
              ...prev,
              places: [...prev.places, {
                id: `new:${crypto.randomUUID()}`,
                name: "",
                address: "",
                pickupAllowed: true,
                returnAllowed: true,
                deliveryFee: "",
                opensAt: "09:00",
                closesAt: "18:00",
                afterHoursFee: "",
              }],
            }))}
          >
            Add a place
          </button>
        </div>
      </Section>

      <Section
        title={`City delivery in ${cityName}`}
        hint="One price. Pickup adds it once. Collection adds it again. Both sides means the price twice. The address or hotel is entered at checkout. Hours and the after-hours fee come from the office above."
      >
        <Check
          label={`Deliver and collect inside ${cityName}`}
          checked={form.cityDeliveryEnabled}
          onChange={(cityDeliveryEnabled) => set("cityDeliveryEnabled", cityDeliveryEnabled)}
        />
        {form.cityDeliveryEnabled && (
          <div className="mt-3 max-w-xs">
            <Money label="Price per trip (€)" value={form.cityDeliveryPrice} onChange={(cityDeliveryPrice) => set("cityDeliveryPrice", cityDeliveryPrice)} />
          </div>
        )}
      </Section>

      {form.airports.length > 0 && (
        <Section title="Airports" hint="Each airport is one fixed choice. Turn on the ones you serve and set the hours and pickup fee. The name cannot be typed.">
          <div className="space-y-4">
            {form.airports.map((airport) => (
              <div key={airport.code} className="rounded-xl border border-border p-4">
                <Check
                  label={airport.name}
                  checked={airport.enabled}
                  onChange={(enabled) => set("airports", form.airports.map((item) => item.code === airport.code ? { ...item, enabled } : item))}
                />
                {airport.enabled && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <TimeField
                      label="Opens"
                      value={airport.opensAt}
                      onChange={(opensAt) => set("airports", form.airports.map((item) => item.code === airport.code ? { ...item, opensAt } : item))}
                    />
                    <TimeField
                      label="Closes"
                      value={airport.closesAt}
                      onChange={(closesAt) => set("airports", form.airports.map((item) => item.code === airport.code ? { ...item, closesAt } : item))}
                    />
                    <Money
                      label="Pickup fee (€)"
                      value={airport.fee}
                      onChange={(fee) => set("airports", form.airports.map((item) => item.code === airport.code ? { ...item, fee } : item))}
                    />
                    <Money
                      label="After-hours fee (€)"
                      value={airport.afterHoursFee}
                      onChange={(afterHoursFee) => set("airports", form.airports.map((item) => item.code === airport.code ? { ...item, afterHoursFee } : item))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Insurance" hint="Basic insurance is included in the daily price. Full insurance is the paid upgrade with no deposit. The deposit amount is set on each car.">
        <div className="space-y-4">
          {form.insurance.map((row) => (
            <div key={row.code} className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-medium text-neutral-500">Name
                <input value={row.label} onChange={(e) => updateInsurance(row.code, { label: e.target.value })} className={inp} />
              </label>
              {row.code === "none" ? (
                <p className="self-end pb-3 text-sm text-neutral-800 sm:col-span-2">Included in the daily price. The deposit is set on each car.</p>
              ) : (
                <>
                  <label className="block text-xs font-medium text-neutral-500">Price (€)
                    <input value={row.price} onChange={(e) => updateInsurance(row.code, { price: e.target.value })} className={inp} placeholder="0" />
                  </label>
                  <label className="block text-xs font-medium text-neutral-500">Charged
                    <select value={row.priceKind} onChange={(e) => updateInsurance(row.code, { priceKind: e.target.value as PriceKind })} className={inp}>
                      <option value="per_day">Per day</option>
                      <option value="flat">Once</option>
                    </select>
                  </label>
                </>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Extras" hint="Each extra has a daily price and a total for the whole rental. Leave both blank to hide it. If both are filled, the customer pays the lower amount.">
        <div className="space-y-4">
          <PricePair label="Child seat" perDay={form.childSeatPricePerDay} max={form.childSeatMaxPrice} onPerDay={(childSeatPricePerDay) => set("childSeatPricePerDay", childSeatPricePerDay)} onMax={(childSeatMaxPrice) => set("childSeatMaxPrice", childSeatMaxPrice)} />
          <PricePair label="Additional driver" perDay={form.additionalDriverPricePerDay} max={form.additionalDriverMaxPrice} onPerDay={(additionalDriverPricePerDay) => set("additionalDriverPricePerDay", additionalDriverPricePerDay)} onMax={(additionalDriverMaxPrice) => set("additionalDriverMaxPrice", additionalDriverMaxPrice)} />
          <PricePair label="GPS" perDay={form.gpsPricePerDay} max={form.gpsMaxPrice} onPerDay={(gpsPricePerDay) => set("gpsPricePerDay", gpsPricePerDay)} onMax={(gpsMaxPrice) => set("gpsMaxPrice", gpsMaxPrice)} />
          <PricePair label="Airport delivery" perDay={form.airportDeliveryPricePerDay} max={form.airportDeliveryMaxPrice} onPerDay={(airportDeliveryPricePerDay) => set("airportDeliveryPricePerDay", airportDeliveryPricePerDay)} onMax={(airportDeliveryMaxPrice) => set("airportDeliveryMaxPrice", airportDeliveryMaxPrice)} />
        </div>
        <div className="mt-4">
          <Check label="Cross-border travel is allowed" checked={form.crossBorderAllowed} onChange={(crossBorderAllowed) => set("crossBorderAllowed", crossBorderAllowed)} />
          {form.crossBorderAllowed && (
            <div className="mt-3 space-y-3">
              <PricePair label="Cross-border" perDay={form.crossBorderPricePerDay} max={form.crossBorderMaxPrice} onPerDay={(crossBorderPricePerDay) => set("crossBorderPricePerDay", crossBorderPricePerDay)} onMax={(crossBorderMaxPrice) => set("crossBorderMaxPrice", crossBorderMaxPrice)} />
              <div>
                <p className="text-xs font-medium text-neutral-500">Countries</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[...CROSS_BORDER_COUNTRIES, ...form.crossBorderCountries.filter((country) => !CROSS_BORDER_COUNTRIES.includes(country))].map((country) => (
                    <Check
                      key={country}
                      label={country}
                      checked={form.crossBorderCountries.includes(country)}
                      onChange={(on) => set("crossBorderCountries", on
                        ? [...form.crossBorderCountries, country]
                        : form.crossBorderCountries.filter((item) => item !== country))}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Deposit and payment at pickup" hint="The deposit amount is set on each car. Full insurance is always no deposit. Tick credit card required only when every customer must have one.">
        <div className="space-y-3">
          <p className="text-xs font-medium text-neutral-500">Deposit can be paid by</p>
          <div className="flex flex-wrap gap-4">
            <Check label="Cash" checked={form.depositPayCash} onChange={(depositPayCash) => set("depositPayCash", depositPayCash)} />
            <Check
              label="Credit card"
              checked={form.creditCardRequired || form.depositPayCard}
              onChange={(depositPayCard) => { if (!form.creditCardRequired) set("depositPayCard", depositPayCard); }}
            />
          </div>
          <label className="block text-xs font-medium text-neutral-500">When the deposit is returned
            <input value={form.depositReturnedWhen} onChange={(e) => set("depositReturnedWhen", e.target.value)} className={inp} placeholder="When the car is returned" />
          </label>
          <Check
            label="Credit card is required"
            checked={form.creditCardRequired}
            onChange={(creditCardRequired) => {
              set("creditCardRequired", creditCardRequired);
              if (creditCardRequired) {
                set("depositPayCard", true);
                set("payCard", true);
              }
            }}
          />
          <p className="pt-2 text-xs font-medium text-neutral-500">Rental can be paid by</p>
          <div className="flex flex-wrap gap-4">
            <Check label="Cash" checked={form.payCash} onChange={(payCash) => set("payCash", payCash)} />
            <Check
              label="Debit card"
              checked={form.creditCardRequired || form.payCard}
              onChange={(payCard) => { if (!form.creditCardRequired) set("payCard", payCard); }}
            />
            <Check label="Bank transfer" checked={form.payTransfer} onChange={(payTransfer) => set("payTransfer", payTransfer)} />
          </div>
        </div>
      </Section>

      <Section title="Rules" hint="Shown before payment.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Money label="Minimum driver age" value={form.minDriverAge} onChange={(minDriverAge) => set("minDriverAge", minDriverAge)} />
          <Money label="Minimum rental (days)" value={form.minRentalDays} onChange={(minRentalDays) => set("minRentalDays", minRentalDays)} />
          <label className="block text-xs font-medium text-neutral-500">Fuel
            <select value={form.fuelPolicy} onChange={(e) => set("fuelPolicy", e.target.value as FuelPolicy)} className={inp}>
              <option value="full_to_full">Full to full</option>
              <option value="same_to_same">Same level to same level</option>
              <option value="full_to_empty">Full to empty</option>
            </select>
          </label>
          <Money label="Different return place (€)" value={form.oneWayFee} onChange={(oneWayFee) => set("oneWayFee", oneWayFee)} />
        </div>
        <div className="mt-3">
          <Check label="Unlimited kilometres" checked={form.unlimitedKm} onChange={(unlimitedKm) => set("unlimitedKm", unlimitedKm)} />
        </div>
        {!form.unlimitedKm && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Money label="Kilometres included per day" value={form.kmPerDay} onChange={(kmPerDay) => set("kmPerDay", kmPerDay)} />
            <Money label="Extra kilometre (€)" value={form.extraKmPrice} onChange={(extraKmPrice) => set("extraKmPrice", extraKmPrice)} />
          </div>
        )}
        <div className="mt-3">
          <Check label="Prices include VAT" checked={form.pricesIncludeVat} onChange={(pricesIncludeVat) => set("pricesIncludeVat", pricesIncludeVat)} />
        </div>
      </Section>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === "saving"} className="rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {status === "saving" ? "Saving…" : "Save offer"}
        </button>
        {status === "saved" && <span className="text-sm text-emerald-700">Saved</span>}
      </div>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-neutral-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border text-brand-700" />
      {label}
    </label>
  );
}

function Money({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-medium text-neutral-500">{label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inp} inputMode="decimal" />
    </label>
  );
}

function PricePair({
  label,
  perDay,
  max,
  onPerDay,
  onMax,
}: {
  label: string;
  perDay: string;
  max: string;
  onPerDay: (value: string) => void;
  onMax: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Money label={`${label} (€/day)`} value={perDay} onChange={onPerDay} />
      <Money label={`${label} total for the rental (€)`} value={max} onChange={onMax} />
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const options = value && !OFFICE_TIME_SLOTS.includes(value) ? [value, ...OFFICE_TIME_SLOTS] : OFFICE_TIME_SLOTS;
  return (
    <label className="block text-xs font-medium text-neutral-500">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inp}>
        <option value="">Not set</option>
        {options.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
      </select>
    </label>
  );
}
