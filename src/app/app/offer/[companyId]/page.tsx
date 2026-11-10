import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { cityAirports, getCityBySlug } from "@/lib/cities";
import { offerGaps, type CappedPrice, type FuelPolicy, type InsuranceCode, type PriceKind } from "@/lib/booking/offer";
import { OfferForm, type OfferFormProps } from "./_components/offer-form";

export const metadata: Metadata = { title: "Online offer" };

function money(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

function clock(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function amount(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function capped(
  perDay: number | string | null | undefined,
  max: number | string | null | undefined,
): CappedPrice {
  return { perDay: amount(perDay), max: amount(max) };
}

const INSURANCE_DEFAULTS: { code: InsuranceCode; label: string }[] = [
  { code: "none", label: "Basic" },
  { code: "full", label: "Full" },
];

export default async function OnlineOfferPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!membership) notFound();

  const { data: company } = await db.from("companies").select("id, name, slug, city, listed_at").eq("id", companyId).maybeSingle();
  if (!company) notFound();
  const city = getCityBySlug(company.city);
  const airportCatalog = city ? cityAirports(city) : [];

  const [{ data: offer }, { data: insurance }, { data: locations }, { data: vehicles }] = await Promise.all([
    db.from("company_booking_offers").select("*").eq("company_id", companyId).maybeSingle(),
    db.from("company_insurance_options").select("*").eq("company_id", companyId),
    db.from("locations").select("*").eq("company_id", companyId).order("is_primary", { ascending: false }),
    db.from("vehicles").select("id, make, model, year, plate, rate_1_day, rate_2_3_day, rate_4_6_day, rate_weekly, rate_monthly, deposit_basic, always_available, photo_urls, status").eq("company_id", companyId).neq("status", "retired").order("make"),
  ]);

  const insuranceByCode = new Map((insurance ?? []).map((row) => [row.code, row]));
  const crossBorderPerDay = offer?.cross_border_price_per_day != null
    ? money(offer.cross_border_price_per_day)
    : offer?.cross_border_price_kind === "per_day" ? money(offer.cross_border_price) : "";
  const crossBorderMax = offer?.cross_border_max_price != null
    ? money(offer.cross_border_max_price)
    : offer?.cross_border_price_kind === "flat" ? money(offer.cross_border_price) : "";
  const initial: OfferFormProps["initial"] = {
    depositPayCash: offer?.deposit_pay_cash ?? true,
    depositPayCard: offer?.deposit_pay_card ?? false,
    depositReturnedWhen: offer?.deposit_returned_when ?? "",
    creditCardRequired: offer?.credit_card_required ?? false,
    payCash: offer?.pay_cash ?? true,
    payCard: offer?.pay_card ?? true,
    payTransfer: offer?.pay_transfer ?? false,
    minDriverAge: String(offer?.min_driver_age ?? 21),
    unlimitedKm: offer?.unlimited_km ?? false,
    kmPerDay: offer?.km_per_day != null ? String(offer.km_per_day) : "",
    extraKmPrice: money(offer?.extra_km_price),
    fuelPolicy: (offer?.fuel_policy ?? "full_to_full") as FuelPolicy,
    minRentalDays: String(offer?.min_rental_days ?? 1),
    oneWayFee: money(offer?.one_way_fee),
    pricesIncludeVat: offer?.prices_include_vat ?? true,
    crossBorderAllowed: offer?.cross_border_allowed ?? false,
    crossBorderPricePerDay: crossBorderPerDay,
    crossBorderMaxPrice: crossBorderMax,
    crossBorderCountries: offer?.cross_border_countries ?? [],
    childSeatPricePerDay: money(offer?.child_seat_price_per_day),
    childSeatMaxPrice: money(offer?.child_seat_max_price),
    additionalDriverPricePerDay: money(offer?.additional_driver_price_per_day),
    additionalDriverMaxPrice: money(offer?.additional_driver_max_price),
    gpsPricePerDay: money(offer?.gps_price_per_day),
    gpsMaxPrice: money(offer?.gps_max_price),
    airportDeliveryPricePerDay: money(offer?.airport_delivery_price_per_day),
    airportDeliveryMaxPrice: money(offer?.airport_delivery_max_price ?? offer?.airport_delivery_price),
    cityDeliveryEnabled: offer?.city_delivery_enabled ?? false,
    cityDeliveryPrice: money(offer?.city_delivery_price),
    insurance: INSURANCE_DEFAULTS.map((item) => {
      const row = insuranceByCode.get(item.code);
      return {
        code: item.code,
        label: row?.label || item.label,
        price: row ? money(row.price) : item.code === "none" ? "0" : "",
        priceKind: (row?.price_kind ?? "per_day") as PriceKind,
        excess: row ? money(row.excess) : "",
      };
    }),
    places: (locations ?? []).filter((place) => place.kind !== "airport" && !place.iata_code).map((place) => ({
      id: place.id,
      name: place.name ?? "",
      address: place.address,
      pickupAllowed: place.pickup_allowed,
      returnAllowed: place.return_allowed,
      deliveryFee: money(place.delivery_fee),
      opensAt: clock(place.opens_at),
      closesAt: clock(place.closes_at),
      afterHoursFee: money(place.after_hours_fee),
    })),
    airports: airportCatalog.map((airport) => {
      const row = (locations ?? []).find((place) => place.iata_code === airport.code);
      return {
        code: airport.code,
        name: airport.name,
        address: airport.name,
        lat: airport.lat,
        lng: airport.lng,
        enabled: Boolean(row && (row.pickup_allowed || row.return_allowed)),
        locationId: row?.id ?? null,
        opensAt: clock(row?.opens_at),
        closesAt: clock(row?.closes_at),
        fee: money(row?.delivery_fee),
        afterHoursFee: money(row?.after_hours_fee),
      };
    }),
  };

  const gaps = offerGaps(
    offer
      ? {
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
          extraKmPrice: amount(offer.extra_km_price),
          fuelPolicy: offer.fuel_policy as FuelPolicy,
          minRentalDays: offer.min_rental_days,
          oneWayFee: amount(offer.one_way_fee),
          pricesIncludeVat: offer.prices_include_vat,
          crossBorderAllowed: offer.cross_border_allowed,
          crossBorder: capped(
            offer.cross_border_price_per_day ?? (offer.cross_border_price_kind === "per_day" ? offer.cross_border_price : null),
            offer.cross_border_max_price ?? (offer.cross_border_price_kind === "flat" ? offer.cross_border_price : null),
          ),
          crossBorderCountries: offer.cross_border_countries ?? [],
          childSeat: capped(offer.child_seat_price_per_day, offer.child_seat_max_price),
          additionalDriver: capped(offer.additional_driver_price_per_day, offer.additional_driver_max_price),
          gps: capped(offer.gps_price_per_day, offer.gps_max_price),
          airportDelivery: capped(offer.airport_delivery_price_per_day, offer.airport_delivery_max_price ?? offer.airport_delivery_price),
          cityDeliveryEnabled: offer.city_delivery_enabled,
          cityDeliveryPrice: amount(offer.city_delivery_price),
          insurance: [],
          places: [],
        }
      : null,
    (insurance ?? []).filter((row) => (row.code === "none" || row.code === "full") && row.price != null).length,
    (locations ?? []).filter((place) => place.pickup_allowed).length + (offer?.city_delivery_enabled ? 1 : 0),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Online offer</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {company.name}. These prices are what a customer sees before paying the booking fee. The rental itself is still paid at pickup.
        </p>
        <p className="mt-3">
          {company.listed_at ? (
            <Link href={`/c/${company.slug}`} className="text-sm font-semibold text-brand-700">Open the public listing</Link>
          ) : (
            <Link href="/app/setup" className="text-sm font-semibold text-brand-700">Finish setup to show the public listing</Link>
          )}
        </p>
      </div>
      <section className="mb-8 rounded-2xl border border-neutral-300 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-950">Cars</h2>
          <Link href={`/app/fleet/${companyId}`} className="text-sm font-semibold text-brand-700">All cars</Link>
        </div>
        {(vehicles ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No cars yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(vehicles ?? []).map((car) => (
              <li key={car.id} className="rounded-xl border border-neutral-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-neutral-950">{car.year} {car.make} {car.model}</p>
                  <Link href={`/app/fleet/${companyId}/${car.id}`} className="text-sm font-semibold text-brand-700">Edit</Link>
                </div>
                <p className="mt-1 text-sm text-neutral-700">
                  Plate {car.plate}
                  {car.always_available ? " · Always available" : ""}
                  {(car.photo_urls?.length ?? 0) === 0 ? " · No photo" : ` · ${car.photo_urls.length} photo${car.photo_urls.length === 1 ? "" : "s"}`}
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  1 day {car.rate_1_day ?? "—"} · 2–3 days {car.rate_2_3_day ?? "—"} · 4–6 days {car.rate_4_6_day ?? "—"} · weekly {car.rate_weekly ?? "—"} · monthly {car.rate_monthly ?? "—"} €/day
                </p>
                <p className="mt-1 text-sm text-neutral-700">Deposit with basic insurance: {car.deposit_basic ?? "—"} €</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      {gaps.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-950">Still needed before every option can show online</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {gaps.map((gap) => <li key={gap}>{gap}</li>)}
          </ul>
        </div>
      )}
      <OfferForm companyId={companyId} cityName={city?.name ?? "the city"} initial={initial} />
    </div>
  );
}
