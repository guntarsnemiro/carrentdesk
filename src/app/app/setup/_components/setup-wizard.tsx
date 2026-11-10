"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressSearch } from "@/components/booking/address-search";
import { VehiclePhotos } from "@/app/app/fleet/[companyId]/_components/vehicle-photos";
import { CROSS_BORDER_COUNTRIES } from "@/lib/booking/countries";
import { OFFICE_TIME_SLOTS } from "@/lib/booking/dates";
import type { AddressHit } from "@/lib/booking/address";

const STEPS = ["Names", "Office", "Places", "Extras", "Cars", "Go live"] as const;

type CarRow = { id: string; make: string; model: string; year: number; plate: string; ready: boolean };
type InsuranceRow = { code: "none" | "full"; price: string };
type AirportRow = { code: string; name: string; enabled: boolean; fee: string };
type PlaceRow = { name: string; address: string; lat: number; lng: number; fee: string; opensAt: string; closesAt: string };
type Progress = { names: boolean; office: boolean; places: boolean; extras: boolean; car: boolean; listed: boolean };

export type SetupWizardProps = {
  initial: {
    companyId: string;
    citySlug: string;
    cityName: string;
    slug: string;
    listed: boolean;
    step: number;
    legalName: string;
    brandName: string;
    homepage: string;
    phone: string;
    email: string;
    office: (AddressHit & { opensAt: string; closesAt: string; pickup: boolean; fee: string }) | null;
    cityDeliveryEnabled: boolean;
    cityDeliveryPrice: string;
    places: PlaceRow[];
    airports: AirportRow[];
    payCash: boolean;
    payCard: boolean;
    creditCardRequired: boolean;
    unlimitedKm: boolean;
    kmPerDay: string;
    crossBorderAllowed: boolean;
    crossBorderPricePerDay: string;
    crossBorderMaxPrice: string;
    crossBorderCountries: string[];
    childSeatPricePerDay: string;
    childSeatMaxPrice: string;
    additionalDriverPricePerDay: string;
    additionalDriverMaxPrice: string;
    insurance: InsuranceRow[];
    cars: CarRow[];
    progress: Progress;
  };
};

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-brand-500";

export function SetupWizard({ initial }: SetupWizardProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(initial.step);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState(initial.progress);
  const [homepage, setHomepage] = useState(initial.homepage);

  const [legalName, setLegalName] = useState(initial.legalName);
  const [brandName, setBrandName] = useState(initial.brandName);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [office, setOffice] = useState<AddressHit | null>(
    initial.office && initial.office.lat ? { label: initial.office.label, lat: initial.office.lat, lng: initial.office.lng } : null,
  );
  const [opensAt, setOpensAt] = useState(initial.office?.opensAt || "09:00");
  const [closesAt, setClosesAt] = useState(initial.office?.closesAt || "18:00");
  const [officePickup, setOfficePickup] = useState(initial.office?.pickup ?? false);
  const [officeFee, setOfficeFee] = useState(initial.office?.fee || "0");
  const [cityDeliveryEnabled, setCityDeliveryEnabled] = useState(initial.cityDeliveryEnabled);
  const [cityDeliveryPrice, setCityDeliveryPrice] = useState(initial.cityDeliveryPrice);
  const [places, setPlaces] = useState(initial.places);
  const [placeName, setPlaceName] = useState("");
  const [placeAddress, setPlaceAddress] = useState<AddressHit | null>(null);
  const [placeFee, setPlaceFee] = useState("0");
  const [placeOpens, setPlaceOpens] = useState(initial.office?.opensAt || "09:00");
  const [placeCloses, setPlaceCloses] = useState(initial.office?.closesAt || "18:00");
  const [placeFormKey, setPlaceFormKey] = useState(0);
  const [airports, setAirports] = useState(initial.airports);
  const [payCash, setPayCash] = useState(initial.payCash);
  const [payCard, setPayCard] = useState(initial.payCard);
  const [creditCardRequired, setCreditCardRequired] = useState(initial.creditCardRequired);
  const [unlimitedKm, setUnlimitedKm] = useState(initial.unlimitedKm);
  const [kmPerDay, setKmPerDay] = useState(initial.kmPerDay);
  const [crossBorderAllowed, setCrossBorderAllowed] = useState(initial.crossBorderAllowed);
  const [crossBorderPricePerDay, setCrossBorderPricePerDay] = useState(initial.crossBorderPricePerDay);
  const [crossBorderMaxPrice, setCrossBorderMaxPrice] = useState(initial.crossBorderMaxPrice);
  const [crossBorderCountries, setCrossBorderCountries] = useState(initial.crossBorderCountries);
  const [childSeatPricePerDay, setChildSeatPricePerDay] = useState(initial.childSeatPricePerDay);
  const [childSeatMaxPrice, setChildSeatMaxPrice] = useState(initial.childSeatMaxPrice);
  const [additionalDriverPricePerDay, setAdditionalDriverPricePerDay] = useState(initial.additionalDriverPricePerDay);
  const [additionalDriverMaxPrice, setAdditionalDriverMaxPrice] = useState(initial.additionalDriverMaxPrice);
  const [insurance, setInsurance] = useState(initial.insurance);
  const [cars, setCars] = useState(initial.cars);
  const [car, setCar] = useState({
    make: "", model: "", year: String(new Date().getFullYear()), plate: "",
    rate1Day: "", rate23Day: "", rate46Day: "", rateWeekly: "", rateMonthly: "",
    depositBasic: "", photoUrls: [] as string[], alwaysAvailable: false,
  });

  async function post(payload: Record<string, unknown>) {
    setSaving(true);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: initial.companyId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      return data as { slug?: string; car?: CarRow };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const handler = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (!input?.validationMessage) return;
      event.preventDefault();
      setError(input.validationMessage);
    };
    node.addEventListener("invalid", handler, true);
    return () => node.removeEventListener("invalid", handler, true);
  }, []);

  useEffect(() => {
    if (!error) return;
    document.getElementById("setup-alert")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [error]);

  async function saveNames(e: React.FormEvent) {
    e.preventDefault();
    const data = await post({ step: "names", legalName, brandName, homepage });
    if (!data) return;
    setProgress((prev) => ({ ...prev, names: true }));
    if (initial.listed) setNote("Saved. Customers still see the brand name.");
    else setStep(1);
  }

  async function saveOffice(e: React.FormEvent) {
    e.preventDefault();
    if (!office) {
      setError("Choose the office address from the search results.");
      return;
    }
    const data = await post({
      step: "office",
      address: office.label,
      lat: office.lat,
      lng: office.lng,
      opensAt,
      closesAt,
      phone,
      email,
    });
    if (!data) return;
    setProgress((prev) => ({ ...prev, office: true }));
    setStep(2);
  }

  async function savePlaces(e: React.FormEvent) {
    e.preventDefault();
    const data = await post({
      step: "places",
      cityDeliveryEnabled,
      cityDeliveryPrice,
      officePickup,
      officeFee,
      places,
      airports: airports.map((airport) => ({ code: airport.code, enabled: airport.enabled, fee: airport.fee })),
    });
    if (!data) return;
    setProgress((prev) => ({ ...prev, places: true }));
    setStep(3);
  }

  async function saveExtras(e: React.FormEvent) {
    e.preventDefault();
    const data = await post({
      step: "extras",
      payCash,
      payCard,
      creditCardRequired,
      unlimitedKm,
      kmPerDay,
      crossBorderAllowed,
      crossBorderPricePerDay,
      crossBorderMaxPrice,
      crossBorderCountries,
      childSeatPricePerDay,
      childSeatMaxPrice,
      additionalDriverPricePerDay,
      additionalDriverMaxPrice,
      insurance,
    });
    if (!data) return;
    setProgress((prev) => ({ ...prev, extras: true }));
    setStep(4);
  }

  async function saveCar(e: React.FormEvent) {
    e.preventDefault();
    if (car.photoUrls.length < 1) {
      setError("Add at least one photo of the car.");
      return;
    }
    const data = await post({ step: "car", ...car });
    if (!data?.car) return;
    setCars((prev) => [...prev, data.car as CarRow]);
    setProgress((prev) => ({ ...prev, car: true }));
    setCar({
      make: "", model: "", year: String(new Date().getFullYear()), plate: "",
      rate1Day: "", rate23Day: "", rate46Day: "", rateWeekly: "", rateMonthly: "",
      depositBasic: "", photoUrls: [], alwaysAvailable: false,
    });
    setNote("Car added. Add another, or continue.");
  }

  async function continueCars() {
    const data = await post({ step: "cars", creditCardRequired, payCard });
    if (!data) return;
    setStep(5);
  }

  async function goLive() {
    const data = await post({ step: "live" });
    if (!data) return;
    router.push(`/app/offer/${initial.companyId}`);
    router.refresh();
  }

  function addPlace() {
    if (!placeAddress) {
      setError("Choose the place address from the search results.");
      return;
    }
    if (placeName.trim().length < 2) {
      setError("Name the pickup place.");
      return;
    }
    setError("");
    setPlaces((prev) => [...prev, {
      name: placeName.trim(),
      address: placeAddress.label,
      lat: placeAddress.lat,
      lng: placeAddress.lng,
      fee: placeFee,
      opensAt: placeOpens,
      closesAt: placeCloses,
    }]);
    setPlaceName("");
    setPlaceAddress(null);
    setPlaceFee("0");
    setPlaceFormKey((key) => key + 1);
  }

  function goBack() {
    setError("");
    setNote("");
    setStep((current) => Math.max(0, current - 1));
  }

  const ready = progress.names && progress.office && progress.places && progress.extras && progress.car;

  return (
    <div ref={rootRef}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Setup</p>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900">Set up {initial.cityName}</h1>
      <p className="mt-1 text-sm text-neutral-500">The city page stays hidden until the last step.</p>

      <ol className="mt-6 flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => { setError(""); setNote(""); setStep(index); }}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                step === index ? "bg-brand-700 text-white" : "bg-surface-soft text-neutral-600"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {error && <p id="setup-alert" className="mt-4 scroll-mt-24 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      {note && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{note}</p>}

      {step === 0 && (
        <form onSubmit={saveNames} className="mt-6 space-y-4">
          <Field label="Legal company name" hint="Invoices and the legal line. Aspero SIA">
            <input className={inp} value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
          </Field>
          <Field label="Brand name" hint="What customers see. Baltic Car Rent">
            <input className={inp} value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
          </Field>
          <Field label="Homepage" hint="Your own website. A dot stays a dot, so balticcar.lv is saved as balticcar.lv.">
            <input
              className={inp}
              value={homepage}
              onChange={(e) => setHomepage(e.target.value)}
              placeholder="balticcar.lv"
              inputMode="url"
              autoComplete="url"
              required
            />
          </Field>
          <Actions saving={saving} label={initial.listed ? "Save names" : "Continue"} />
          {initial.listed && <Back />}
        </form>
      )}

      {step === 1 && (
        <form onSubmit={saveOffice} className="mt-6 space-y-4">
          <p className="text-sm text-neutral-600">This is the company address. It is not a pickup place. Add pickup places on the next step if customers can collect a car here.</p>
          <AddressSearch
            citySlug={initial.citySlug}
            cityName={initial.cityName}
            label="Office address"
            initial={office}
            onSelect={setOffice}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TimeField label="Opens" value={opensAt} onChange={setOpensAt} />
            <TimeField label="Closes" value={closesAt} onChange={setClosesAt} />
            <Field label="Phone">
              <input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </Field>
            <Field label="Email">
              <input className={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
          </div>
          <Actions saving={saving} label="Continue" onBack={goBack} />
        </form>
      )}

      {step === 2 && (
        <form onSubmit={savePlaces} className="mt-6 space-y-5">
          <p className="text-sm text-neutral-600">Choose where a customer can collect and return a car. Then add any other address.</p>
          <Choice
            title={`Deliver and collect inside ${initial.cityName}`}
            checked={cityDeliveryEnabled}
            onChange={setCityDeliveryEnabled}
          >
            <Field label="Price per trip (€)" hint="Charged once for delivery and once for collection.">
              <input className={inp} inputMode="decimal" value={cityDeliveryPrice} onChange={(e) => setCityDeliveryPrice(e.target.value)} />
            </Field>
          </Choice>
          {airports.map((airport) => (
            <Choice
              key={airport.code}
              title={airport.name}
              checked={airport.enabled}
              onChange={(enabled) => setAirports((prev) => prev.map((item) => item.code === airport.code ? { ...item, enabled } : item))}
            >
              <Field label="Price (€)">
                <input
                  className={inp}
                  inputMode="decimal"
                  value={airport.fee}
                  onChange={(e) => setAirports((prev) => prev.map((item) => item.code === airport.code ? { ...item, fee: e.target.value } : item))}
                />
              </Field>
            </Choice>
          ))}
          {initial.office && (
            <Choice
              title="Office address"
              detail={initial.office.label}
              checked={officePickup}
              onChange={setOfficePickup}
            >
              <Field label="Price (€)" hint="Use 0 when pickup at the office is free.">
                <input className={inp} inputMode="decimal" value={officeFee} onChange={(e) => setOfficeFee(e.target.value)} />
              </Field>
            </Choice>
          )}
          <div className="space-y-3 rounded-xl border border-neutral-300 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-950">Add your own place</p>
            <p className="text-sm text-neutral-600">A hotel, station, or address in another city.</p>
            {places.length > 0 && (
              <ul className="space-y-2">
                {places.map((place, index) => (
                  <li key={`${place.address}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900">
                    <span>
                      <span className="block font-semibold">{place.name}</span>
                      <span className="text-neutral-600">{place.address}</span>
                    </span>
                    <button type="button" className="text-sm font-semibold text-neutral-700 underline" onClick={() => setPlaces((prev) => prev.filter((_, i) => i !== index))}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Name">
              <input className={inp} value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="Hotel or station" />
            </Field>
            <AddressSearch
              key={placeFormKey}
              citySlug={initial.citySlug}
              cityName={initial.cityName}
              label="Address"
              anywhere
              onSelect={setPlaceAddress}
            />
            <Field label="Price (€)" hint="Use 0 when pickup here is free.">
              <input className={inp} inputMode="decimal" value={placeFee} onChange={(e) => setPlaceFee(e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <TimeField label="Opens" value={placeOpens} onChange={setPlaceOpens} />
              <TimeField label="Closes" value={placeCloses} onChange={setPlaceCloses} />
            </div>
            <button type="button" onClick={addPlace} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900">Add this place</button>
          </div>
          <Actions saving={saving} label="Continue" onBack={goBack} />
        </form>
      )}

      {step === 3 && (
        <form onSubmit={saveExtras} className="mt-6 space-y-5">
          <PricePair label="Child seat" perDay={childSeatPricePerDay} max={childSeatMaxPrice} onPerDay={setChildSeatPricePerDay} onMax={setChildSeatMaxPrice} />
          <PricePair label="Additional driver" perDay={additionalDriverPricePerDay} max={additionalDriverMaxPrice} onPerDay={setAdditionalDriverPricePerDay} onMax={setAdditionalDriverMaxPrice} />
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input type="checkbox" checked={crossBorderAllowed} onChange={(e) => setCrossBorderAllowed(e.target.checked)} />
            Cross-border travel is allowed
          </label>
          {crossBorderAllowed && (
            <>
              <PricePair label="Cross-border" perDay={crossBorderPricePerDay} max={crossBorderMaxPrice} onPerDay={setCrossBorderPricePerDay} onMax={setCrossBorderMaxPrice} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CROSS_BORDER_COUNTRIES.map((country) => (
                  <label key={country} className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={crossBorderCountries.includes(country)}
                      onChange={(e) => setCrossBorderCountries((prev) => e.target.checked ? [...prev, country] : prev.filter((item) => item !== country))}
                    />
                    {country}
                  </label>
                ))}
              </div>
            </>
          )}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-neutral-950">Insurance</p>
            <p className="text-sm text-neutral-600">Basic insurance is included in the daily price. Full insurance is optional.</p>
          <div className="rounded-xl border border-neutral-300 bg-white p-4">
            <p className="text-base font-semibold text-neutral-950">Basic insurance</p>
            <p className="mt-1 text-sm text-neutral-700">Included in the daily price. The deposit is entered on each car.</p>
          </div>
          {insurance.filter((row) => row.code === "full").map((row) => (
            <div key={row.code} className="rounded-xl border border-neutral-300 bg-white p-4">
              <p className="text-base font-semibold text-neutral-950">Full insurance</p>
              <p className="mt-1 text-sm text-neutral-700">No deposit. This price is added to the rental.</p>
              <div className="mt-3 max-w-xs">
                <Field label="Price per day (€)">
                  <input className={inp} inputMode="decimal" value={row.price} onChange={(e) => setInsurance((prev) => prev.map((item) => item.code === row.code ? { ...item, price: e.target.value } : item))} />
                </Field>
              </div>
            </div>
          ))}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-900">
            <label className="flex items-center gap-2"><input type="checkbox" checked={payCash} onChange={(e) => setPayCash(e.target.checked)} /> Cash at pickup</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={payCard} onChange={(e) => setPayCard(e.target.checked)} /> Debit card at pickup</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={unlimitedKm} onChange={(e) => setUnlimitedKm(e.target.checked)} /> Unlimited kilometres</label>
          </div>
          {!unlimitedKm && (
            <Field label="Kilometres per day">
              <input className={inp} inputMode="numeric" value={kmPerDay} onChange={(e) => setKmPerDay(e.target.value)} />
            </Field>
          )}
          <Actions saving={saving} label="Continue" onBack={goBack} />
        </form>
      )}

      {step === 4 && (
        <form onSubmit={saveCar} className="mt-6 space-y-4">
          {cars.length > 0 && (
            <ul className="space-y-2">
              {cars.map((item) => (
                <li key={item.id} className="rounded-xl border border-border px-4 py-3 text-sm text-neutral-800">
                  {item.year} {item.make} {item.model}
                  <span className="ml-2 text-neutral-400">{item.plate}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make"><input className={inp} value={car.make} onChange={(e) => setCar({ ...car, make: e.target.value })} required /></Field>
            <Field label="Model"><input className={inp} value={car.model} onChange={(e) => setCar({ ...car, model: e.target.value })} required /></Field>
            <Field label="Year"><input className={inp} inputMode="numeric" value={car.year} onChange={(e) => setCar({ ...car, year: e.target.value })} required /></Field>
            <Field label="Plate, office only"><input className={inp} value={car.plate} onChange={(e) => setCar({ ...car, plate: e.target.value })} required /></Field>
            <Field label="1 day (€/day)"><input className={inp} inputMode="decimal" value={car.rate1Day} onChange={(e) => setCar({ ...car, rate1Day: e.target.value })} required /></Field>
            <Field label="2–3 days (€/day)"><input className={inp} inputMode="decimal" value={car.rate23Day} onChange={(e) => setCar({ ...car, rate23Day: e.target.value })} /></Field>
            <Field label="4–6 days (€/day)"><input className={inp} inputMode="decimal" value={car.rate46Day} onChange={(e) => setCar({ ...car, rate46Day: e.target.value })} /></Field>
            <Field label="Weekly (€/day)"><input className={inp} inputMode="decimal" value={car.rateWeekly} onChange={(e) => setCar({ ...car, rateWeekly: e.target.value })} /></Field>
            <Field label="Monthly (€/day)"><input className={inp} inputMode="decimal" value={car.rateMonthly} onChange={(e) => setCar({ ...car, rateMonthly: e.target.value })} /></Field>
            <Field label="Deposit with basic insurance (€)" hint="Basic insurance is included in the daily price. Full insurance has no deposit."><input className={inp} inputMode="decimal" value={car.depositBasic} onChange={(e) => setCar({ ...car, depositBasic: e.target.value })} required /></Field>
          </div>
          <label className="flex items-start gap-2 rounded-xl border border-neutral-300 bg-white p-4 text-sm text-neutral-900">
            <input type="checkbox" className="mt-1" checked={creditCardRequired} onChange={(e) => setCreditCardRequired(e.target.checked)} />
            <span>
              <span className="font-medium">Credit card required for the deposit</span>
              <span className="mt-0.5 block text-neutral-600">The deposit amount is the field above, on each car.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-neutral-900">
            <input type="checkbox" className="mt-1" checked={car.alwaysAvailable} onChange={(e) => setCar({ ...car, alwaysAvailable: e.target.checked })} />
            <span>
              <span className="font-medium">Always available</span>
              <span className="mt-0.5 block text-neutral-600">Turn this on when you have more than one of this car. One booking does not take it off the list.</span>
            </span>
          </label>
          <VehiclePhotos
            companyId={initial.companyId}
            allowDraft
            urls={car.photoUrls}
            onChange={(photoUrls) => setCar({ ...car, photoUrls })}
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={saving} onClick={goBack} className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900">Back</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Saving…" : "Add this car"}
            </button>
            <button type="button" disabled={saving || !progress.car} onClick={continueCars} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-neutral-800 disabled:opacity-50">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === 5 && (
        <div className="mt-6 space-y-4">
          <ul className="space-y-2 text-sm">
            <Check done={progress.names} label="Legal name, brand, and page address" />
            <Check done={progress.office} label="Office address" />
            <Check done={progress.places} label="At least one pickup place" />
            <Check done={progress.extras} label="Extras and insurance" />
            <Check done={progress.car} label="At least one car with a price, a deposit, and a photo" />
          </ul>
          {progress.listed ? (
            <Back />
          ) : (
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={saving} onClick={goBack} className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900">Back</button>
              <button type="button" disabled={saving || !ready} onClick={goLive} className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Saving…" : "See online offer"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Choice({
  title, detail, checked, onChange, children,
}: {
  title: string;
  detail?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-300 bg-white p-4">
      <label className="flex items-start gap-2 text-sm font-medium text-neutral-950">
        <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>
          {title}
          {detail && <span className="mt-0.5 block font-normal text-neutral-600">{detail}</span>}
        </span>
      </label>
      {checked && children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      {hint && <span className="mt-0.5 block text-xs font-normal text-neutral-500">{hint}</span>}
      {children}
    </label>
  );
}

function Actions({ saving, label, onBack }: { saving: boolean; label: string; onBack?: () => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {onBack && (
        <button type="button" disabled={saving} onClick={onBack} className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900">
          Back
        </button>
      )}
      <button type="submit" disabled={saving} className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

function Back() {
  return <a href="/app/dashboard" className="inline-block text-sm font-semibold text-brand-700">Back to the office</a>;
}

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <li className={done ? "text-emerald-800" : "text-neutral-500"}>
      {done ? "✓" : "○"} {label}
    </li>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      <select className={inp} value={value} onChange={(e) => onChange(e.target.value)}>
        {OFFICE_TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
      </select>
    </label>
  );
}

function PricePair({
  label, perDay, max, onPerDay, onMax,
}: {
  label: string;
  perDay: string;
  max: string;
  onPerDay: (value: string) => void;
  onMax: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={`${label} per day (€)`}>
        <input className={inp} inputMode="decimal" value={perDay} onChange={(e) => onPerDay(e.target.value)} placeholder="Blank to hide" />
      </Field>
      <Field label={`${label} total (€)`}>
        <input className={inp} inputMode="decimal" value={max} onChange={(e) => onMax(e.target.value)} placeholder="Blank if no cap" />
      </Field>
    </div>
  );
}
