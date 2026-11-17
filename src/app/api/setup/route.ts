import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { cityAirports, CITIES, getCityBySlug } from "@/lib/cities";
import { slugify, uniqueSlug } from "@/lib/join/signup-helpers";
import { advanceStep, DRAFT_BRAND, isDraftSlug, pageSlugError } from "@/lib/onboarding";

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
    if (step === "offer") return await saveOffer(db, company, body);
    if (step === "car") return await saveCar(db, company, body);
    if (step === "live") return await goLive(db, company);
    return NextResponse.json({ error: "Unknown setup step." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save this step.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ── Step 0: Company details ──────────────────────────────────────────────────

async function saveNames(
  db: Db,
  company: { id: string; slug: string; listed_at: string | null; onboarding_step: number },
  body: Record<string, unknown>,
) {
  const legalName = typeof body.legalName === "string" ? body.legalName.trim() : "";
  const brandName = typeof body.brandName === "string" ? body.brandName.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (legalName.length < 2) throw new Error("Enter the legal company name.");
  if (brandName.length < 2 || brandName === DRAFT_BRAND) throw new Error("Enter the brand name customers will see.");
  if (phone.replace(/\D/g, "").length < 8) throw new Error("Enter a phone number.");
  if (!email.includes("@")) throw new Error("Enter an email address.");

  let slug = company.slug;
  if (!company.listed_at) {
    const requested = slugify(brandName);
    const problem = pageSlugError(requested, CITIES.map((c) => c.slug));
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
      description: description || null,
      phone,
      email,
      whatsapp: phone,
      onboarding_step: advanceStep(company.onboarding_step, 1),
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);
  if (error) throw new Error("Could not save the company details.");
  return NextResponse.json({ ok: true, slug });
}

// ── Step 1: Office ───────────────────────────────────────────────────────────

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

  const alwaysOpen = body.alwaysOpen === true;
  let opensAt = "00:00";
  let closesAt = "23:59";
  if (!alwaysOpen) {
    opensAt = clock(body.opensAt, "Opening time");
    closesAt = clock(body.closesAt, "Closing time");
    if (closesAt <= opensAt) throw new Error("Closing time must be after opening time.");
  }

  const { data: existing } = await db
    .from("locations")
    .select("id")
    .eq("company_id", company.id)
    .eq("is_primary", true)
    .maybeSingle();

  const locationPayload = {
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
    ? await db.from("locations").update(locationPayload).eq("id", existing.id).eq("company_id", company.id)
    : await db.from("locations").insert(locationPayload);
  if (write.error) throw new Error("Could not save the office.");

  await db
    .from("companies")
    .update({
      address,
      onboarding_step: advanceStep(company.onboarding_step, 2),
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);

  return NextResponse.json({ ok: true });
}

// ── Step 2: Pickup options ────────────────────────────────────────────────────

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

  const officePickup = body.officePickup === true;
  const officeFee = officePickup ? money(body.officeFee, "Office pickup price", true) : null;

  const cityDeliveryEnabled = body.cityDeliveryEnabled === true;
  const cityDeliveryPrice = cityDeliveryEnabled
    ? money(body.cityDeliveryPrice, "City delivery price", true)
    : null;

  const requested = Array.isArray(body.airports) ? body.airports : [];
  const airportOn = requested.some(
    (item) => item && typeof item === "object" && (item as { enabled?: boolean }).enabled === true,
  );

  if (!officePickup && !cityDeliveryEnabled && !airportOn) {
    throw new Error("Enable at least one pickup option.");
  }

  // Update office as a pickup location
  const { error: officePlaceError } = await db
    .from("locations")
    .update({
      pickup_allowed: officePickup,
      return_allowed: officePickup,
      delivery_fee: officeFee,
    })
    .eq("company_id", company.id)
    .eq("is_primary", true);
  if (officePlaceError) throw new Error("Could not save the office pickup option.");

  // Save offer row for city delivery
  const { error: offerError } = await db.from("company_booking_offers").upsert({
    company_id: company.id,
    city_delivery_enabled: cityDeliveryEnabled,
    city_delivery_price: cityDeliveryPrice,
    updated_at: new Date().toISOString(),
  });
  if (offerError) throw new Error("Could not save the pickup options.");

  // Airports
  const catalog = cityAirports(city);
  for (const airport of catalog) {
    const row = requested.find(
      (item) => item && typeof item === "object" && (item as { code?: string }).code === airport.code,
    ) as { enabled?: boolean; fee?: unknown } | undefined;
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

// ── Step 3: First car (saves individual vehicle) ─────────────────────────────

const VALID_CATEGORIES = [
  "economy", "compact", "midsize", "suv", "van", "electric", "cargo", "luxury", "other",
] as const;
type VehicleCategory = typeof VALID_CATEGORIES[number];

async function saveCar(
  db: Db,
  company: { id: string },
  body: Record<string, unknown>,
) {
  const make = typeof body.make === "string" ? body.make.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const plate = typeof body.plate === "string" ? body.plate.trim().toUpperCase() : "";
  const year = Number(body.year);
  const categoryRaw = typeof body.category === "string" ? body.category : "economy";
  const category: VehicleCategory = VALID_CATEGORIES.includes(categoryRaw as VehicleCategory)
    ? (categoryRaw as VehicleCategory)
    : "economy";
  const alwaysAvailable = body.alwaysAvailable === true;

  if (make.length < 1 || model.length < 1) throw new Error("Enter the make and model.");
  if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1) {
    throw new Error("Enter the car year.");
  }
  // plate is optional — no minimum length check

  const rate1 = money(body.rate1Day, "Daily price", true);
  if (rate1 == null || rate1 <= 0) throw new Error("Enter the daily rental price.");
  const depositBasic = money(body.depositBasic, "Deposit amount", true);
  if (depositBasic == null) throw new Error("Enter the deposit amount.");

  const rateWeekly = money(body.rateWeekly, "Weekly price", false);
  const rateMonthly = money(body.rateMonthly, "Monthly price", false);

  // Per-car full insurance (optional)
  const fullInsuranceEnabled = body.fullInsuranceEnabled === true;
  const fullInsurancePrice = fullInsuranceEnabled
    ? money(body.fullInsurancePrice, "Full insurance price per day", true)
    : null;

  const photoUrls = Array.isArray(body.photoUrls)
    ? body.photoUrls
        .filter((url): url is string => typeof url === "string" && url.startsWith("https://"))
        .slice(0, 8)
    : [];
  if (photoUrls.length < 1) throw new Error("Add at least one photo of the car.");

  const { data, error } = await db
    .from("vehicles")
    .insert({
      company_id: company.id,
      make,
      model,
      year,
      plate: plate || null,
      category,
      bookable: true,
      status: "available",
      rate_1_day: rate1,
      rate_2_3_day: null,
      rate_4_6_day: null,
      rate_weekly: rateWeekly,
      rate_monthly: rateMonthly,
      daily_rate: rate1,
      deposit_basic: depositBasic,
      deposit_partial: null,
      photo_urls: photoUrls,
      always_available: alwaysAvailable,
    })
    .select("id, make, model, year, plate, category")
    .single();
  if (error || !data) {
    const duplicate =
      (error?.message ?? "").toLowerCase().includes("duplicate") ||
      (error?.message ?? "").toLowerCase().includes("unique");
    throw new Error(duplicate ? "That plate is already on another car." : "Could not add the car.");
  }

  // Save per-car insurance options
  const basicIns = {
    company_id: company.id,
    code: "none" as const,
    label: "Basic",
    price: 0,
    price_kind: "per_day",
    excess: 0,
  };
  await db.from("company_insurance_options").upsert(basicIns, { onConflict: "company_id,code" });

  if (fullInsuranceEnabled && fullInsurancePrice != null) {
    await db.from("company_insurance_options").upsert(
      { company_id: company.id, code: "full" as const, label: "Full", price: fullInsurancePrice, price_kind: "per_day", excess: 0 },
      { onConflict: "company_id,code" },
    );
  }

  return NextResponse.json({ ok: true, car: { ...data, ready: true } });
}

// ── Step 3 (continued): Payment options + insurance ──────────────────────────

async function saveOffer(
  db: Db,
  company: { id: string; onboarding_step: number },
  body: Record<string, unknown>,
) {
  const payCash = body.payCash === true;
  const payCard = body.payCard === true;         // debit card
  const payCreditCard = body.payCreditCard === true; // credit card
  if (!payCash && !payCard && !payCreditCard) {
    throw new Error("Choose at least one way the customer can pay at pickup.");
  }

  const depositCash = body.depositCash === true;
  const depositCard = body.depositCard === true;
  if (!depositCash && !depositCard) {
    throw new Error("Choose how the deposit is taken — cash or credit card.");
  }
  const creditCardRequired = depositCard; // credit card pre-auth for deposit

  const ready = await hasReadyCar(db, company.id);
  if (!ready) throw new Error("Add a car with a price, a deposit, and a photo first.");

  // Upsert booking offer
  const { error: offerError } = await db.from("company_booking_offers").upsert({
    company_id: company.id,
    pay_cash: payCash,
    pay_card: payCard,
    pay_credit_card: payCreditCard,
    pay_transfer: false,
    credit_card_required: creditCardRequired,
    deposit_pay_cash: depositCash,
    deposit_pay_card: depositCard,
    deposit_returned_when: "When the car is returned",
    unlimited_km: true,
    km_per_day: null,
    extra_km_price: null,
    min_driver_age: 21,
    updated_at: new Date().toISOString(),
  });
  if (offerError) throw new Error("Could not save the payment options.");

  await db
    .from("companies")
    .update({ onboarding_step: advanceStep(company.onboarding_step, 5), updated_at: new Date().toISOString() })
    .eq("id", company.id);
  return NextResponse.json({ ok: true });
}

// ── Step 4: Go live ───────────────────────────────────────────────────────────

async function goLive(
  db: Db,
  company: {
    id: string;
    name: string;
    slug: string;
    invoice_legal_name: string | null;
    listed_at: string | null;
    onboarding_step: number;
  },
) {
  if (company.listed_at) return NextResponse.json({ ok: true, listed: true });
  if (!company.invoice_legal_name || company.name === DRAFT_BRAND || isDraftSlug(company.slug)) {
    throw new Error("Save the company details first.");
  }
  const { data: office } = await db
    .from("locations")
    .select("id")
    .eq("company_id", company.id)
    .eq("is_primary", true)
    .maybeSingle();
  if (!office) throw new Error("Save the office address first.");
  if (company.onboarding_step < 5) throw new Error("Complete all setup steps before going live.");
  if (!(await hasReadyCar(db, company.id))) throw new Error("Add a car with a price, a deposit, and a photo.");

  const { error } = await db
    .from("companies")
    .update({
      listed_at: new Date().toISOString(),
      onboarding_step: 6,
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);
  if (error) throw new Error("Could not publish the rental.");
  return NextResponse.json({ ok: true, listed: true });
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
