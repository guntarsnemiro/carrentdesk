import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isVehicleBlocked, type BlockingBooking } from "@/lib/booking/availability";
import { quoteForDates, rentalDays } from "@/lib/booking/platform-fee";
import { CITY_PLACE_ID, rateForDays, sortInsurance, type CappedPrice, type FuelPolicy, type InsuranceCode, type OfferPlace, type PlaceKind, type PriceKind, type PublicOffer, type VehicleRates } from "@/lib/booking/offer";
import { PILOT_CITY_SLUG, PILOT_COMPANY_SLUG } from "@/lib/booking/pilot";
import { getCityBySlug } from "@/lib/cities";
import type { Database } from "@/lib/supabase/database.types";
import type { AvailableCarsResult, PublicBookableCar } from "@/lib/booking/public-types";

export { PILOT_CITY_SLUG, PILOT_COMPANY_SLUG };
export type { AvailableCarsResult, PublicBookableCar };

export class BookingSearchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BookingSearchError";
  }
}

function parseInstant(value: string, label: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BookingSearchError(`Invalid ${label} datetime.`, 400);
  }
  return d;
}

type VehicleRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  seats: number | null;
  fuel: string | null;
  category: string;
  photo_urls: string[] | null;
  daily_rate: number | string | null;
  rate_1_day: number | string | null;
  rate_2_3_day: number | string | null;
  rate_4_6_day: number | string | null;
  rate_weekly: number | string | null;
  rate_monthly: number | string | null;
  deposit_basic: number | string | null;
  deposit_partial: number | string | null;
  always_available: boolean | null;
  status: string;
};

const VEHICLE_COLUMNS = "id, make, model, year, seats, fuel, category, photo_urls, daily_rate, rate_1_day, rate_2_3_day, rate_4_6_day, rate_weekly, rate_monthly, deposit_basic, deposit_partial, always_available, status";

function num(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ratesOf(v: VehicleRow): VehicleRates {
  return {
    rate1: num(v.rate_1_day) ?? num(v.daily_rate),
    rate23: num(v.rate_2_3_day),
    rate46: num(v.rate_4_6_day),
    rateWeekly: num(v.rate_weekly),
    rateMonthly: num(v.rate_monthly),
  };
}

function toPublicCar(
  v: VehicleRow,
  company: { id: string; name: string; slug: string },
  quote: { days: number; rentalTotal: number; platformFee: number },
  available: boolean,
): PublicBookableCar {
  return {
    id: v.id,
    companyId: company.id,
    companyName: company.name,
    companySlug: company.slug,
    make: v.make,
    model: v.model,
    year: v.year,
    seats: v.seats,
    fuel: v.fuel,
    category: v.category,
    photoUrls: v.photo_urls ?? [],
    depositBasic: num(v.deposit_basic),
    depositPartial: num(v.deposit_partial),
    dailyRate: quote.days > 0 ? Math.round((quote.rentalTotal / quote.days) * 100) / 100 : Number(v.daily_rate),
    days: quote.days,
    rentalTotal: quote.rentalTotal,
    platformFee: quote.platformFee,
    available,
  };
}

function isPublicCandidate(v: VehicleRow): boolean {
  return (ratesOf(v).rate1 ?? 0) > 0 && (v.photo_urls?.length ?? 0) > 0;
}

function clock(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}

function readCrossBorder(offer: {
  cross_border_price: number | string | null;
  cross_border_price_kind: string;
  cross_border_price_per_day: number | string | null;
  cross_border_max_price: number | string | null;
}): CappedPrice {
  const perDay = num(offer.cross_border_price_per_day) ?? (offer.cross_border_price_kind === "per_day" ? num(offer.cross_border_price) : null);
  const max = num(offer.cross_border_max_price) ?? (offer.cross_border_price_kind === "flat" ? num(offer.cross_border_price) : null);
  return { perDay, max };
}

/**
 * Bookable cars for a company in a date range.
 * Uses the service role so we can read office bookings (not public via RLS),
 * then returns a sanitized list — no plate, VIN, or internal notes.
 */
export async function findAvailableCars(opts: {
  slug: string;
  start: string;
  end: string;
  now?: Date;
}): Promise<AvailableCarsResult> {
  const start = parseInstant(opts.start, "pickup");
  const end = parseInstant(opts.end, "return");
  if (end <= start) {
    throw new BookingSearchError("Return must be after pickup.", 400);
  }

  const now = opts.now ?? new Date();
  const db = createServiceRoleClient();

  const { data: company, error: companyError } = await db
    .from("companies")
    .select("id, name, slug, listed_at")
    .eq("slug", opts.slug)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company?.listed_at) throw new BookingSearchError("Company not found.", 404);

  const { data: vehicles, error: vehicleError } = await db
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .eq("company_id", company.id)
    .eq("bookable", true)
    .neq("status", "retired");
  if (vehicleError) throw vehicleError;

  const candidates = ((vehicles ?? []) as VehicleRow[]).filter(isPublicCandidate);
  const days = quoteForDates(1, start, end).days;

  if (candidates.length === 0) {
    return {
      companyId: company.id,
      companyName: company.name,
      slug: company.slug,
      start: start.toISOString(),
      end: end.toISOString(),
      days,
      cars: [],
    };
  }

  const ids = candidates.map((v) => v.id);
  const { data: bookings, error: bookingError } = await db
    .from("bookings")
    .select("id, vehicle_id, start_at, end_at, status, pending_expires_at")
    .in("vehicle_id", ids)
    .neq("status", "cancelled");
  if (bookingError) throw bookingError;

  const blocking = (bookings ?? []) as BlockingBooking[];
  const cars: PublicBookableCar[] = [];

  for (const v of candidates) {
    if (!v.always_available && isVehicleBlocked(blocking, v.id, start, end, { now })) continue;
    const rate = rateForDays(ratesOf(v), rentalDays(start, end));
    if (rate == null) continue;
    cars.push(toPublicCar(v, company, quoteForDates(rate, start, end), true));
  }

  cars.sort((a, b) => a.rentalTotal - b.rentalTotal || a.make.localeCompare(b.make));

  return {
    companyId: company.id,
    companyName: company.name,
    slug: company.slug,
    start: start.toISOString(),
    end: end.toISOString(),
    days,
    cars,
  };
}

/** Listed companies in a city. A car is included when it has a 1-day price and a photo. */
export async function findAvailableCarsForCity(opts: {
  city: string;
  start: string;
  end: string;
  now?: Date;
}): Promise<AvailableCarsResult> {
  const start = parseInstant(opts.start, "pickup");
  const end = parseInstant(opts.end, "return");
  if (end <= start) {
    throw new BookingSearchError("Return must be after pickup.", 400);
  }

  const empty: AvailableCarsResult = {
    city: opts.city,
    start: start.toISOString(),
    end: end.toISOString(),
    days: quoteForDates(1, start, end).days,
    cars: [],
  };

  const city = getCityBySlug(opts.city);
  if (!city) return empty;

  const db = createServiceRoleClient();
  const { data: companies, error } = await db
    .from("companies")
    .select("slug")
    .eq("city", city.slug)
    .not("listed_at", "is", null);
  if (error) throw error;

  const cars: PublicBookableCar[] = [];
  let days = empty.days;

  for (const company of companies ?? []) {
    try {
      const result = await findAvailableCars({
        slug: company.slug,
        start: opts.start,
        end: opts.end,
        now: opts.now,
      });
      days = result.days;
      cars.push(...result.cars);
    } catch (err) {
      if (err instanceof BookingSearchError && err.status === 404) continue;
      throw err;
    }
  }

  cars.sort((a, b) => a.rentalTotal - b.rentalTotal || a.make.localeCompare(b.make));

  return {
    city: opts.city,
    start: start.toISOString(),
    end: end.toISOString(),
    days,
    cars,
  };
}

export type PublicCarDetail = {
  car: PublicBookableCar;
  offer: PublicOffer | null;
  city: string;
  start: string;
  end: string;
  days: number;
};

/** One public car for the booking page. 404 unless the company is listed and the car is ready. */
export async function getPublicCar(opts: {
  vehicleId: string;
  start: string;
  end: string;
  now?: Date;
}): Promise<PublicCarDetail> {
  const start = parseInstant(opts.start, "pickup");
  const end = parseInstant(opts.end, "return");
  if (end <= start) {
    throw new BookingSearchError("Return must be after pickup.", 400);
  }

  const now = opts.now ?? new Date();
  const db = createServiceRoleClient();

  const { data: vehicle, error: vehicleError } = await db
    .from("vehicles")
    .select(`${VEHICLE_COLUMNS}, company_id, bookable`)
    .eq("id", opts.vehicleId)
    .maybeSingle();
  if (vehicleError) throw vehicleError;
  if (!vehicle || !vehicle.bookable || vehicle.status === "retired" || !isPublicCandidate(vehicle as VehicleRow)) {
    throw new BookingSearchError("Car not found.", 404);
  }

  const { data: company, error: companyError } = await db
    .from("companies")
    .select("id, name, slug, city, listed_at")
    .eq("id", vehicle.company_id)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company?.listed_at) {
    throw new BookingSearchError("Car not found.", 404);
  }

  const { data: bookings, error: bookingError } = await db
    .from("bookings")
    .select("id, vehicle_id, start_at, end_at, status, pending_expires_at")
    .eq("vehicle_id", vehicle.id)
    .neq("status", "cancelled");
  if (bookingError) throw bookingError;

  const available = Boolean((vehicle as VehicleRow).always_available) || !isVehicleBlocked(
    (bookings ?? []) as BlockingBooking[],
    vehicle.id,
    start,
    end,
    { now },
  );
  const rate = rateForDays(ratesOf(vehicle as VehicleRow), rentalDays(start, end)) ?? Number(vehicle.daily_rate);
  const quote = quoteForDates(rate, start, end);

  return {
    car: toPublicCar(vehicle as VehicleRow, company, quote, available),
    offer: await loadPublicOffer(db, company.id),
    city: company.city,
    start: start.toISOString(),
    end: end.toISOString(),
    days: quote.days,
  };
}

async function loadPublicOffer(db: ReturnType<typeof createServiceRoleClient>, companyId: string): Promise<PublicOffer | null> {
  const [{ data: offer }, { data: insurance }, { data: places }] = await Promise.all([
    db.from("company_booking_offers").select("*").eq("company_id", companyId).maybeSingle(),
    db.from("company_insurance_options").select("*").eq("company_id", companyId),
    db.from("locations").select("id, name, address, kind, iata_code, is_primary, pickup_allowed, return_allowed, delivery_fee, opens_at, closes_at, after_hours_fee").eq("company_id", companyId),
  ]);
  if (!offer) return null;
  const officeHours = (places ?? [])
    .filter((place) => place.kind !== "airport" && place.opens_at && place.closes_at)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
  const mappedPlaces: OfferPlace[] = (places ?? [])
    .filter((place) => place.pickup_allowed || place.return_allowed)
    .map((place) => ({
      id: place.id,
      name: place.name ?? "",
      address: place.address,
      kind: (place.kind === "airport" ? "airport" : "office") as PlaceKind,
      iataCode: place.iata_code,
      pickupAllowed: place.pickup_allowed,
      returnAllowed: place.return_allowed,
      deliveryFee: num(place.delivery_fee),
      opensAt: clock(place.opens_at),
      closesAt: clock(place.closes_at),
      afterHoursFee: num(place.after_hours_fee),
    }));
  if (offer.city_delivery_enabled) {
    mappedPlaces.push({
      id: CITY_PLACE_ID,
      name: "City delivery",
      address: "",
      kind: "city",
      iataCode: null,
      pickupAllowed: true,
      returnAllowed: true,
      deliveryFee: null,
      opensAt: clock(officeHours?.opens_at ?? null),
      closesAt: clock(officeHours?.closes_at ?? null),
      afterHoursFee: num(officeHours?.after_hours_fee),
    });
  }
  const crossBorder = readCrossBorder(offer);
  return {
    depositPayCash: offer.deposit_pay_cash,
    depositPayCard: offer.deposit_pay_card,
    depositReturnedWhen: offer.deposit_returned_when,
    creditCardRequired: offer.credit_card_required,
    payCash: offer.pay_cash,
    payCard: offer.pay_card,
    payTransfer: offer.pay_transfer,
    minDriverAge: offer.min_driver_age,
    unlimitedKm: offer.unlimited_km,
    kmPerDay: offer.km_per_day,
    extraKmPrice: num(offer.extra_km_price),
    fuelPolicy: offer.fuel_policy as FuelPolicy,
    minRentalDays: offer.min_rental_days,
    oneWayFee: num(offer.one_way_fee),
    pricesIncludeVat: offer.prices_include_vat,
    crossBorderAllowed: offer.cross_border_allowed,
    crossBorder,
    crossBorderCountries: offer.cross_border_countries ?? [],
    childSeat: { perDay: num(offer.child_seat_price_per_day), max: num(offer.child_seat_max_price) },
    additionalDriver: { perDay: num(offer.additional_driver_price_per_day), max: num(offer.additional_driver_max_price) },
    gps: { perDay: num(offer.gps_price_per_day), max: num(offer.gps_max_price) },
    airportDelivery: {
      perDay: num(offer.airport_delivery_price_per_day),
      max: num(offer.airport_delivery_max_price) ?? num(offer.airport_delivery_price),
    },
    cityDeliveryEnabled: offer.city_delivery_enabled,
    cityDeliveryPrice: num(offer.city_delivery_price),
    insurance: sortInsurance((insurance ?? [])
      .filter((row) => row.code === "none" || row.code === "full")
      .map((row) => ({
      code: row.code as InsuranceCode,
      label: row.label,
      price: Number(row.price),
      priceKind: row.price_kind as PriceKind,
      excess: Number(row.excess),
    }))),
    places: mappedPlaces,
  };
}
