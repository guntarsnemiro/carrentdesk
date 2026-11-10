import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { cityAirports, getCityBySlug } from "@/lib/cities";
import { DRAFT_BRAND, homepageField, isDraftSlug } from "@/lib/onboarding";
import { SetupWizard, type SetupWizardProps } from "./_components/setup-wizard";

export const metadata: Metadata = { title: "Setup" };

function clock(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function money(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login?next=/app/setup");

  const db = createServiceRoleClient();
  const { data: membership } = await db
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-2xl font-bold text-neutral-900">Create your account first</h1>
        <p className="mt-2 text-sm text-neutral-600">Setup starts after registration.</p>
        <Link href="/join" className="mt-4 inline-block text-sm font-semibold text-brand-700">Create an account</Link>
      </div>
    );
  }

  const { data: company } = await db
    .from("companies")
    .select("id, name, slug, city, phone, email, website, invoice_legal_name, listed_at, onboarding_step")
    .eq("id", membership.company_id)
    .maybeSingle();
  if (!company) redirect("/join");

  if (company.onboarding_step >= 6 && company.listed_at && focus !== "names") {
    redirect("/app/dashboard");
  }

  const city = getCityBySlug(company.city);
  const [{ data: locations }, { data: offer }, { data: insurance }, { data: vehicles }] = await Promise.all([
    db.from("locations").select("id, name, address, lat, lng, is_primary, kind, iata_code, pickup_allowed, delivery_fee, opens_at, closes_at").eq("company_id", company.id),
    db.from("company_booking_offers").select("city_delivery_enabled, city_delivery_price, pay_cash, pay_card, credit_card_required, unlimited_km, km_per_day, cross_border_allowed, cross_border_price_per_day, cross_border_max_price, cross_border_countries, child_seat_price_per_day, child_seat_max_price, additional_driver_price_per_day, additional_driver_max_price").eq("company_id", company.id).maybeSingle(),
    db.from("company_insurance_options").select("code, price").eq("company_id", company.id),
    db.from("vehicles").select("id, make, model, year, plate, rate_1_day, deposit_basic, photo_urls, status").eq("company_id", company.id).neq("status", "retired"),
  ]);

  const office = (locations ?? []).find((place) => place.is_primary) ?? null;
  const insuranceByCode = new Map((insurance ?? []).map((row) => [row.code, row]));
  const cars = (vehicles ?? []).map((car) => ({
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    plate: car.plate,
    ready: car.rate_1_day != null && car.deposit_basic != null && (car.photo_urls?.length ?? 0) > 0,
  }));

  const initial: SetupWizardProps["initial"] = {
    companyId: company.id,
    citySlug: company.city,
    cityName: city?.name ?? company.city,
    slug: company.slug,
    listed: Boolean(company.listed_at),
    step: focus === "names" ? 0 : Math.min(company.onboarding_step, 5),
    legalName: company.invoice_legal_name ?? "",
    brandName: company.name === DRAFT_BRAND ? "" : company.name,
    homepage: homepageField(company.website),
    phone: company.phone ?? "",
    email: company.email ?? "",
    office: office?.address && office.lat != null && office.lng != null
      ? {
          label: office.address,
          lat: office.lat,
          lng: office.lng,
          opensAt: clock(office.opens_at) || "09:00",
          closesAt: clock(office.closes_at) || "18:00",
          pickup: Boolean(office.pickup_allowed),
          fee: money(office.delivery_fee) || "0",
        }
      : null,
    cityDeliveryEnabled: offer?.city_delivery_enabled ?? false,
    cityDeliveryPrice: money(offer?.city_delivery_price),
    places: (locations ?? [])
      .filter((place) => !place.is_primary && !place.iata_code && place.kind !== "airport" && place.lat != null && place.lng != null)
      .map((place) => ({
        name: place.name ?? "",
        address: place.address,
        lat: place.lat as number,
        lng: place.lng as number,
        fee: money(place.delivery_fee) || "0",
        opensAt: clock(place.opens_at) || "09:00",
        closesAt: clock(place.closes_at) || "18:00",
      })),
    airports: (city ? cityAirports(city) : []).map((airport) => {
      const row = (locations ?? []).find((place) => place.iata_code === airport.code);
      return {
        code: airport.code,
        name: airport.name,
        enabled: Boolean(row && row.pickup_allowed),
        fee: money(row?.delivery_fee),
      };
    }),
    payCash: offer?.pay_cash ?? true,
    payCard: offer?.pay_card ?? true,
    creditCardRequired: offer?.credit_card_required ?? false,
    unlimitedKm: offer?.unlimited_km ?? true,
    kmPerDay: offer?.km_per_day != null ? String(offer.km_per_day) : "",
    crossBorderAllowed: offer?.cross_border_allowed ?? false,
    crossBorderPricePerDay: money(offer?.cross_border_price_per_day),
    crossBorderMaxPrice: money(offer?.cross_border_max_price),
    crossBorderCountries: offer?.cross_border_countries ?? [],
    childSeatPricePerDay: money(offer?.child_seat_price_per_day),
    childSeatMaxPrice: money(offer?.child_seat_max_price),
    additionalDriverPricePerDay: money(offer?.additional_driver_price_per_day),
    additionalDriverMaxPrice: money(offer?.additional_driver_max_price),
    insurance: (["none", "full"] as const).map((code) => ({
      code,
      price: money(insuranceByCode.get(code)?.price) || (code === "none" ? "0" : ""),
    })),
    cars,
    progress: {
      names: Boolean(company.invoice_legal_name && company.name !== DRAFT_BRAND && !isDraftSlug(company.slug)),
      office: Boolean(office?.address && office.opens_at && office.closes_at),
      places: company.onboarding_step >= 3,
      extras: company.onboarding_step >= 4,
      car: cars.some((car) => car.ready),
      listed: Boolean(company.listed_at),
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <SetupWizard initial={initial} />
    </div>
  );
}
