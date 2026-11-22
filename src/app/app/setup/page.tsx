import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { cityAirports, getCityBySlug } from "@/lib/cities";
import { DRAFT_BRAND, isDraftSlug } from "@/lib/onboarding";
import { SetupWizard, type SetupWizardProps } from "./_components/setup-wizard";

export const metadata: Metadata = { title: "Setup" };

function clockField(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function moneyField(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

/** Map DB onboarding_step (0-6) to wizard step index (0-4). */
function dbToWizardStep(dbStep: number): number {
  if (dbStep <= 1) return 0; // company details
  if (dbStep === 2) return 1; // office
  if (dbStep === 3) return 2; // pickup
  if (dbStep <= 5) return 3; // car + payment
  return 4;                  // go live
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
        <Link href="/join" className="mt-4 inline-block text-sm font-semibold text-brand-700">
          Create an account
        </Link>
      </div>
    );
  }

  const { data: company } = await db
    .from("companies")
    .select("id, name, slug, city, city_name, phone, email, description, invoice_legal_name, listed_at, onboarding_step")
    .eq("id", membership.company_id)
    .maybeSingle();
  if (!company) redirect("/join");

  if (company.onboarding_step >= 6 && company.listed_at && focus !== "names") {
    redirect("/app/dashboard");
  }

  // Use known city metadata if available, otherwise fall back to stored city_name
  const knownCity = getCityBySlug(company.city);
  const city = knownCity;

  const [{ data: locations }, { data: offer }, { data: insurance }, { data: vehicles }] =
    await Promise.all([
      db
        .from("locations")
        .select(
          "id, name, address, lat, lng, is_primary, kind, iata_code, pickup_allowed, delivery_fee, opens_at, closes_at",
        )
        .eq("company_id", company.id),
      db
        .from("company_booking_offers")
        .select(
          "city_delivery_enabled, city_delivery_price, pay_cash, pay_card, pay_credit_card, credit_card_required, deposit_pay_cash, deposit_pay_card",
        )
        .eq("company_id", company.id)
        .maybeSingle(),
      db.from("company_insurance_options").select("code, price").eq("company_id", company.id),
      db
        .from("vehicles")
        .select("id, make, model, year, plate, rate_1_day, deposit_basic, photo_urls, status")
        .eq("company_id", company.id)
        .neq("status", "retired"),
    ]);

  const office = (locations ?? []).find((place) => place.is_primary) ?? null;
  // insurance loaded for future use (fleet settings)

  const cars = (vehicles ?? []).map((car) => ({
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    plate: car.plate,
    ready:
      car.rate_1_day != null &&
      car.deposit_basic != null &&
      (car.photo_urls?.length ?? 0) > 0,
  }));

  const alwaysOpen =
    clockField(office?.opens_at) === "00:00" && clockField(office?.closes_at) === "23:59";

  const wizardStep = focus === "names" ? 0 : dbToWizardStep(company.onboarding_step);

  const initial: SetupWizardProps["initial"] = {
    companyId: company.id,
    citySlug: company.city,
    cityName: city?.name ?? company.city_name ?? company.city,
    slug: company.slug,
    listed: Boolean(company.listed_at),
    step: wizardStep,

    // Step 0 — Company
    brandName: company.name === DRAFT_BRAND ? "" : company.name,
    legalName: company.invoice_legal_name ?? "",
    description: company.description ?? "",
    phone: company.phone ?? "",
    email: company.email ?? "",

    // Step 1 — Office
    office:
      office?.address && office.lat != null && office.lng != null
        ? {
            label: office.address,
            lat: office.lat,
            lng: office.lng,
            alwaysOpen,
            opensAt: alwaysOpen ? "09:00" : clockField(office.opens_at) || "09:00",
            closesAt: alwaysOpen ? "18:00" : clockField(office.closes_at) || "18:00",
          }
        : null,

    // Step 2 — Pickup
    officePickup: Boolean(office?.pickup_allowed),
    officeFee: moneyField(office?.delivery_fee) || "0",
    cityDeliveryEnabled: offer?.city_delivery_enabled ?? false,
    cityDeliveryPrice: moneyField(offer?.city_delivery_price),
    airports: (city ? cityAirports(city) : []).map((airport) => {
      const row = (locations ?? []).find((p) => p.iata_code === airport.code);
      return {
        code: airport.code,
        name: airport.name,
        enabled: Boolean(row?.pickup_allowed),
        fee: moneyField(row?.delivery_fee) || "0",
      };
    }),

    // Step 3 — Payment + Insurance
    payCash: offer?.pay_cash ?? true,
    payCard: offer?.pay_card ?? false,
    payCreditCard: offer?.pay_credit_card ?? false,
    depositCash: offer?.deposit_pay_cash ?? true,
    depositCard: offer?.deposit_pay_card ?? false,

    cars,

    progress: {
      names: Boolean(
        company.invoice_legal_name &&
          company.name !== DRAFT_BRAND &&
          !isDraftSlug(company.slug) &&
          company.phone &&
          company.email,
      ),
      office: Boolean(office?.address && office.opens_at && office.closes_at),
      places: company.onboarding_step >= 3,
      offer: company.onboarding_step >= 5,
      car: cars.filter((car) => car.ready).length >= 3,
      listed: Boolean(company.listed_at),
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <SetupWizard initial={initial} />
    </div>
  );
}
