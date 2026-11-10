import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { cityAirports, CITIES, getCityBySlug } from "@/lib/cities";
import { CROSS_BORDER_COUNTRIES } from "@/lib/booking/countries";
import { slugify, uniqueSlug } from "@/lib/join/signup-helpers";
import { advanceStep, DRAFT_BRAND, isDraftSlug, normalizeHomepage, pageSlugError } from "@/lib/onboarding";

type Db = ReturnType<typeof createServiceRoleClient>;

function money(value: unknown, label: string, required: boolean): number | null {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    if (required) throw new Error(`${label} is required. Use 0 if it is free.`);
    return null;
  }
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a number.`);
  return Math.round(n * 100) / 100;
}

function clock(value: unknown, label: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) {
    throw new Error(`${label} must be a 24-hour time, such as 09:00.`);
  }
  return text;
}

async function loadCompany(db: Db, userId: string, companyId: string) {
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!membership) return null;
  const { data: company } = await db
    .from("companies")
    .select("id, name, slug, city, invoice_legal_name, listed_at, onboarding_step")
    .eq("id", companyId)
    .maybeSingle();
  return company;
}

export async function POST(req: Request) {
  try {
    const authClient = await createAuthServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

    const body = await req.json();
    const companyId = typeof body.companyId === "string" ? body.companyId : "";
    const step = typeof body.step === "string" ? body.step : "";
    const db = createServiceRoleClient();
    const company = await loadCompany(db, user.id, companyId);
    if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

    if (step === "names") return await saveNames(db, company, body);
    if (step === "office") return await saveOffice(db, company, body);
    if (step === "places") return await savePlaces(db, company, body);
    if (step === "extras") return await saveExtras(db, company, body);
    if (step === "car") return await saveCar(db, company, body);
    if (step === "cars") return await markCars(db, company, body);
    if (step === "live") return await goLive(db, company);
    return NextResponse.json({ error: "Unknown setup step." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save this step.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function saveNames(
  db: Db,
  company: { id: string; slug: string; listed_at: string | null; onboarding_step: number },
  body: Record<string, unknown>,
) {
  const legalName = typeof body.legalName === "string" ? body.legalName.trim() : "";
  const brandName = typeof body.brandName === "string" ? body.brandName.trim() : "";
  const homepage = normalizeHomepage(typeof body.homepage === "string" ? body.homepage : "");
  if (legalName.length < 2) throw new Error("Enter the legal company name.");
  if (brandName.length < 2 || brandName === DRAFT_BRAND) throw new Error("Enter the brand name customers will see.");

  let slug = company.slug;
  if (!company.listed_at) {
    const requested = slugify(brandName);
    const problem = pageSlugError(requested, CITIES.map((city) => city.slug));
    if (problem) throw new Error("Use a brand name with at least 3 letters.");
    const { data: taken } = await db
      .from("companies")
      .select("id")
      .eq("slug", requested)
      .neq("id", company.id)
      .maybeSingle();
    slug = taken ? await uniqueSlug(db, requested) : requested;
  }

  const { error } = await db
    .from("companies")
    .update({
      invoice_legal_name: legalName,
      name: brandName,
      slug,
      website: homepage,
      onboarding_step: advanceStep(company.onboarding_step, 1),
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);
  if (error) throw new Error("Could not save the names.");
  return NextResponse.json({ ok: true, slug });
}

async function saveOffice(
  db: Db,
  company: { id: string; onboarding_step: number },
  body: Record<string, unknown>,
) {
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (address.length < 4 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Choose the office address from the search results.");
  }
  const opensAt = clock(body.opensAt, "Opening time");
  const closesAt = clock(body.closesAt, "Closing time");
  if (closesAt <= opensAt) throw new Error("Closing time must be after opening time.");
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (phone.replace(/\D/g, "").length < 8) throw new Error("Enter a phone number.");
  if (!email.includes("@")) throw new Error("Enter an email.");

  const { data: existing } = await db
    .from("locations")
    .select("id")
    .eq("company_id", company.id)
    .eq("is_primary", true)
    .maybeSingle();

  const payload = {
    company_id: company.id,
    kind: "office",
    name: "Office",
    address,
    lat,
    lng,
    is_primary: true,
    pickup_allowed: false,
    return_allowed: false,
    opens_at: opensAt,
    closes_at: closesAt,
    iata_code: null,
  };

  const write = existing
    ? await db.from("locations").update(payload).eq("id", existing.id).eq("company_id", company.id)
    : await db.from("locations").insert(payload);
  if (write.error) throw new Error("Could not save the office.");

  await db
    .from("companies")
    .update({
      address,
      phone,
      email,
      onboarding_step: advanceStep(company.onboarding_step, 2),
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);

  return NextResponse.json({ ok: true });
}

async function savePlaces(
  db: Db,
  company: { id: string; city: string; onboarding_step: number },
  body: Record<string, unknown>,
) {
  const city = getCityBySlug(company.city);
  if (!city) throw new Error("This company has no city.");

  const { data: office } = await db
    .from("locations")
    .select("opens_at, closes_at")
    .eq("company_id", company.id)
    .eq("is_primary", true)
    .maybeSingle();
  if (!office?.opens_at || !office.closes_at) throw new Error("Save the office address first.");

  const enabled = body.cityDeliveryEnabled === true;
  const price = enabled ? money(body.cityDeliveryPrice, "City delivery price", true) : null;

  const incomingPlaces = Array.isArray(body.places) ? body.places : [];
  const places = incomingPlaces.map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const address = typeof row.address === "string" ? row.address.trim() : "";
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    if (name.length < 2 || address.length < 4 || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("Each pickup place needs a name and an address from the search results.");
    }
    const opensAt = clock(row.opensAt, "Opening time");
    const closesAt = clock(row.closesAt, "Closing time");
    if (closesAt <= opensAt) throw new Error("Closing time must be after opening time.");
    return {
      company_id: company.id,
      kind: "office",
      name,
      address,
      lat,
      lng,
      is_primary: false,
      pickup_allowed: true,
      return_allowed: true,
      delivery_fee: money(row.fee, `${name} price`, true),
      opens_at: opensAt,
      closes_at: closesAt,
      iata_code: null,
    };
  });

  const requested = Array.isArray(body.airports) ? body.airports : [];
  const airportOn = requested.some((item) => item && typeof item === "object" && (item as { enabled?: boolean }).enabled === true);
  const officePickup = body.officePickup === true;
  if (places.length === 0 && !enabled && !airportOn && !officePickup) {
    throw new Error("Add at least one pickup place. The office is not offered for pickup unless you select it here.");
  }

  const { data: existingPlaces } = await db
    .from("locations")
    .select("id, iata_code, is_primary, kind")
    .eq("company_id", company.id);
  const customIds = (existingPlaces ?? [])
    .filter((place) => !place.is_primary && !place.iata_code && place.kind !== "airport")
    .map((place) => place.id);
  if (customIds.length > 0) {
    const { error: clearError } = await db.from("locations").delete().in("id", customIds).eq("company_id", company.id);
    if (clearError) throw new Error("Could not update the pickup places.");
  }
  if (places.length > 0) {
    const { error: placeError } = await db.from("locations").insert(places);
    if (placeError) throw new Error("Could not save the pickup places.");
  }

  const officeFee = officePickup ? money(body.officeFee, "Office pickup price", true) : null;
  const { error: officePlaceError } = await db
    .from("locations")
    .update({
      pickup_allowed: officePickup,
      return_allowed: officePickup,
      delivery_fee: officeFee,
    })
    .eq("company_id", company.id)
    .eq("is_primary", true);
  if (officePlaceError) throw new Error("Could not save the office as a pickup place.");

  const { error: offerError } = await db.from("company_booking_offers").upsert({
    company_id: company.id,
    city_delivery_enabled: enabled,
    city_delivery_price: price,
    updated_at: new Date().toISOString(),
  });
  if (offerError) throw new Error("Could not save the places.");

  const catalog = cityAirports(city);
  for (const airport of catalog) {
    const row = requested.find((item) => item && typeof item === "object" && (item as { code?: string }).code === airport.code) as { enabled?: boolean; fee?: unknown } | undefined;
    const on = row?.enabled === true;
    const fee = on ? money(row?.fee, `${airport.code} price`, true) : null;
    const { data: existing } = await db
      .from("locations")
      .select("id")
      .eq("company_id", company.id)
      .eq("iata_code", airport.code)
      .maybeSingle();
    const payload = {
      company_id: company.id,
      kind: "airport",
      iata_code: airport.code,
      name: airport.name,
      address: airport.name,
      lat: airport.lat,
      lng: airport.lng,
      pickup_allowed: on,
      return_allowed: on,
      delivery_fee: fee,
      opens_at: office.opens_at,
      closes_at: office.closes_at,
      is_primary: false,
    };
    if (!on && !existing) continue;
    const write = existing
      ? await db.from("locations").update(payload).eq("id", existing.id).eq("company_id", company.id)
      : await db.from("locations").insert(payload);
    if (write.error) throw new Error(`Could not save ${airport.code}.`);
  }

  await db
    .from("companies")
    .update({ onboarding_step: advanceStep(company.onboarding_step, 3), updated_at: new Date().toISOString() })
    .eq("id", company.id);
  return NextResponse.json({ ok: true });
}

async function saveExtras(
  db: Db,
  company: { id: string; onboarding_step: number },
  body: Record<string, unknown>,
) {
  const payCash = body.payCash === true;
  const payCard = body.payCard === true;
  const creditCardRequired = body.creditCardRequired === true;
  if (!payCash && !payCard && !creditCardRequired) {
    throw new Error("Choose how the customer pays the rental at pickup.");
  }
  const unlimitedKm = body.unlimitedKm === true;
  const kmPerDay = unlimitedKm ? null : money(body.kmPerDay, "Kilometres per day", true);
  if (!unlimitedKm && (kmPerDay == null || !Number.isInteger(kmPerDay))) {
    throw new Error("Kilometres per day must be a whole number, or turn on unlimited kilometres.");
  }

  const crossBorderAllowed = body.crossBorderAllowed === true;
  const countries = Array.isArray(body.crossBorderCountries)
    ? body.crossBorderCountries.filter((country): country is string => typeof country === "string" && CROSS_BORDER_COUNTRIES.includes(country))
    : [];
  const crossBorderPerDay = crossBorderAllowed ? money(body.crossBorderPricePerDay, "Cross-border daily price", false) : null;
  const crossBorderMax = crossBorderAllowed ? money(body.crossBorderMaxPrice, "Cross-border total", false) : null;
  if (crossBorderAllowed && crossBorderPerDay == null && crossBorderMax == null) {
    throw new Error("Cross-border needs a daily price, a total for the rental, or both.");
  }
  if (crossBorderAllowed && countries.length === 0) {
    throw new Error("Choose at least one country for cross-border travel.");
  }

  const childPerDay = money(body.childSeatPricePerDay, "Child seat daily price", false);
  const childMax = money(body.childSeatMaxPrice, "Child seat total", false);
  const driverPerDay = money(body.additionalDriverPricePerDay, "Additional driver daily price", false);
  const driverMax = money(body.additionalDriverMaxPrice, "Additional driver total", false);

  const insuranceRows = [
    { code: "none" as const, label: "Basic" },
    { code: "full" as const, label: "Full" },
  ];
  const incoming = Array.isArray(body.insurance) ? body.insurance : [];
  const insurance = insuranceRows.map((item) => {
    const row = incoming.find((entry) => entry && typeof entry === "object" && (entry as { code?: string }).code === item.code) as { price?: unknown } | undefined;
    return {
      company_id: company.id,
      code: item.code,
      label: item.label,
      price: item.code === "none" ? 0 : (money(row?.price, `${item.label} price`, true) ?? 0),
      price_kind: "per_day",
      excess: 0,
    };
  });

  const { error: offerError } = await db.from("company_booking_offers").upsert({
    company_id: company.id,
    pay_cash: payCash,
    pay_card: creditCardRequired ? true : payCard,
    credit_card_required: creditCardRequired,
    deposit_pay_cash: creditCardRequired ? false : true,
    deposit_pay_card: creditCardRequired ? true : payCard,
    deposit_returned_when: "When the car is returned",
    unlimited_km: unlimitedKm,
    km_per_day: unlimitedKm ? null : kmPerDay,
    extra_km_price: null,
    cross_border_allowed: crossBorderAllowed,
    cross_border_price_per_day: crossBorderPerDay,
    cross_border_max_price: crossBorderMax,
    cross_border_price: crossBorderPerDay ?? crossBorderMax,
    cross_border_price_kind: crossBorderPerDay != null ? "per_day" : "flat",
    cross_border_countries: countries,
    child_seat_price_per_day: childPerDay,
    child_seat_max_price: childMax,
    additional_driver_price_per_day: driverPerDay,
    additional_driver_max_price: driverMax,
    min_driver_age: 21,
    updated_at: new Date().toISOString(),
  });
  if (offerError) throw new Error("Could not save the extras.");

  const { error: insuranceError } = await db
    .from("company_insurance_options")
    .upsert(insurance, { onConflict: "company_id,code" });
  if (insuranceError) throw new Error("Could not save the insurance choices.");
  await db.from("company_insurance_options").delete().eq("company_id", company.id).eq("code", "partial");

  await db
    .from("companies")
    .update({ onboarding_step: advanceStep(company.onboarding_step, 4), updated_at: new Date().toISOString() })
    .eq("id", company.id);
  return NextResponse.json({ ok: true });
}

async function saveCar(
  db: Db,
  company: { id: string },
  body: Record<string, unknown>,
) {
  const make = typeof body.make === "string" ? body.make.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const plate = typeof body.plate === "string" ? body.plate.trim().toUpperCase() : "";
  const year = Number(body.year);
  if (make.length < 1 || model.length < 1) throw new Error("Enter the make and model.");
  if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1) {
    throw new Error("Enter the car year.");
  }
  if (plate.length < 2) throw new Error("Enter the plate. Customers do not see it.");

  const rate1 = money(body.rate1Day, "1-day price", true);
  const depositBasic = money(body.depositBasic, "Deposit with basic insurance", true);
  const rate23 = money(body.rate23Day, "2–3 day price", false);
  const rate46 = money(body.rate46Day, "4–6 day price", false);
  const rateWeekly = money(body.rateWeekly, "Weekly price", false);
  const rateMonthly = money(body.rateMonthly, "Monthly price", false);
  const photoUrls = Array.isArray(body.photoUrls)
    ? body.photoUrls.filter((url): url is string => typeof url === "string" && url.startsWith("https://")).slice(0, 8)
    : [];
  if (photoUrls.length < 1) throw new Error("Add at least one photo of the car.");
  const alwaysAvailable = body.alwaysAvailable === true;

  const { data, error } = await db
    .from("vehicles")
    .insert({
      company_id: company.id,
      make,
      model,
      year,
      plate,
      bookable: true,
      status: "available",
      rate_1_day: rate1,
      rate_2_3_day: rate23,
      rate_4_6_day: rate46,
      rate_weekly: rateWeekly,
      rate_monthly: rateMonthly,
      daily_rate: rate1,
      deposit_basic: depositBasic,
      deposit_partial: null,
      photo_urls: photoUrls,
      always_available: alwaysAvailable,
    })
    .select("id, make, model, year, plate")
    .single();
  if (error || !data) {
    const duplicate = (error?.message ?? "").toLowerCase().includes("duplicate") || (error?.message ?? "").toLowerCase().includes("unique");
    throw new Error(duplicate ? "That plate is already on a car." : "Could not add the car.");
  }
  return NextResponse.json({ ok: true, car: { ...data, ready: true } });
}

async function markCars(db: Db, company: { id: string; onboarding_step: number }, body: Record<string, unknown>) {
  const ready = await hasReadyCar(db, company.id);
  if (!ready) throw new Error("Add a car with a 1-day price, a deposit, and a photo.");
  const creditCardRequired = body.creditCardRequired === true;
  const payCard = body.payCard === true;
  await db.from("company_booking_offers").update({
    credit_card_required: creditCardRequired,
    deposit_pay_cash: creditCardRequired ? false : true,
    deposit_pay_card: creditCardRequired ? true : payCard,
    pay_card: creditCardRequired ? true : payCard,
    updated_at: new Date().toISOString(),
  }).eq("company_id", company.id);
  await db
    .from("companies")
    .update({ onboarding_step: advanceStep(company.onboarding_step, 5), updated_at: new Date().toISOString() })
    .eq("id", company.id);
  return NextResponse.json({ ok: true });
}

async function hasReadyCar(db: Db, companyId: string) {
  const { data } = await db
    .from("vehicles")
    .select("id, photo_urls")
    .eq("company_id", companyId)
    .neq("status", "retired")
    .not("rate_1_day", "is", null)
    .not("deposit_basic", "is", null)
    .limit(20);
  return (data ?? []).some((car) => (car.photo_urls?.length ?? 0) > 0);
}

async function goLive(db: Db, company: { id: string; name: string; slug: string; invoice_legal_name: string | null; listed_at: string | null; onboarding_step: number }) {
  if (company.listed_at) return NextResponse.json({ ok: true, listed: true });
  if (!company.invoice_legal_name || company.name === DRAFT_BRAND || isDraftSlug(company.slug)) {
    throw new Error("Save the legal name, the brand, and the page address first.");
  }
  const { data: office } = await db
    .from("locations")
    .select("id")
    .eq("company_id", company.id)
    .eq("is_primary", true)
    .maybeSingle();
  if (!office) throw new Error("Save the office address first.");
  if (company.onboarding_step < 4) throw new Error("Save places and extras first.");
  if (!(await hasReadyCar(db, company.id))) throw new Error("Add a car with a 1-day price, a deposit, and a photo.");

  const { error } = await db
    .from("companies")
    .update({
      listed_at: new Date().toISOString(),
      onboarding_step: 6,
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);
  if (error) throw new Error("Could not show this rental on the city page.");
  return NextResponse.json({ ok: true, listed: true });
}
