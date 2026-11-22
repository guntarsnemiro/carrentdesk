import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { BookingSearchError, getPublicCar } from "@/lib/booking/search";
import {
  quoteOffer,
  selectionQuery,
  type InsuranceCode,
  type OfferPlace,
  type OfferSelection,
} from "@/lib/booking/offer";
import { PENDING_PAYMENT_HOLD_MINUTES, roundMoney } from "@/lib/booking/platform-fee";
import { releaseUnpaidHold } from "@/lib/booking/payment";
import { getStripe, publicSiteOrigin } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { carTitle } from "@/lib/booking/public-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function readBool(value: unknown): boolean {
  return value === true;
}

function readSelection(raw: unknown): OfferSelection {
  if (!raw || typeof raw !== "object") {
    throw new CheckoutError("Choose the insurance and pickup place again.", 400);
  }
  const body = raw as Record<string, unknown>;
  const code = body.insuranceCode;
  if (code !== "none" && code !== "full") {
    throw new CheckoutError("Choose Basic or Full insurance.", 400);
  }
  const pickupTime = cleanText(body.pickupTime, 5);
  const returnTime = cleanText(body.returnTime, 5);
  if (!/^\d{2}:\d{2}$/.test(pickupTime) || !/^\d{2}:\d{2}$/.test(returnTime)) {
    throw new CheckoutError("Pickup and return times are required.", 400);
  }
  const pickupPlaceId = typeof body.pickupPlaceId === "string" ? body.pickupPlaceId : null;
  const returnPlaceId = typeof body.returnPlaceId === "string" ? body.returnPlaceId : null;
  return {
    insuranceCode: code,
    pickupPlaceId,
    returnPlaceId,
    childSeatInfant: readBool(body.childSeatInfant),
    childSeatToddler: readBool(body.childSeatToddler),
    childSeatChild: readBool(body.childSeatChild),
    additionalDriver: readBool(body.additionalDriver),
    gps: readBool(body.gps),
    airportDelivery: readBool(body.airportDelivery),
    crossBorder: readBool(body.crossBorder),
    driverAge: null,
    pickupTime,
    returnTime,
  };
}

function requirePriced(selected: boolean, quoted: boolean, message: string) {
  if (selected && !quoted) throw new CheckoutError(message, 400);
}

function placeLine(place: OfferPlace, side: "pickup" | "return", address: string, flight: string): string {
  if (place.kind === "city") {
    const prefix = side === "pickup" ? "Delivery" : "Collection";
    return `${prefix}: ${address}`.slice(0, 300);
  }
  const name = place.name || place.address || (place.iataCode ? `Airport ${place.iataCode}` : "Office");
  if (side === "pickup" && place.kind === "airport" && flight) {
    return `${name} · flight ${flight}`.slice(0, 300);
  }
  return name.slice(0, 300);
}

/**
 * POST /api/booking/checkout
 * Recomputes the confirmation fee, holds the car for 30 minutes, and opens
 * a Stripe Checkout page for that fee only. The rental is not charged.
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the checkout as JSON." }, { status: 400 });
  }
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Send the checkout as JSON." }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;
  const vehicleId = cleanText(body.vehicleId, 40);
  const start = cleanText(body.start, 40);
  const end = cleanText(body.end, 40);
  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 160).toLowerCase();
  const phone = cleanText(body.phone, 40);
  const flight = cleanText(body.flightNumber, 16).toUpperCase();
  const flightOk = /^[A-Z0-9 -]{2,16}$/.test(flight) ? flight : "";
  const customerRequest = cleanText(body.customerRequest, 1000);
  const deliveryLabel = cleanText(body.deliveryLabel, 180);
  const collectionLabel = cleanText(body.collectionLabel, 180);
  const sameAddress = readBool(body.sameAddress);
  const age = typeof body.driverAge === "number" ? body.driverAge : Number(body.driverAge);

  try {
    if (!UUID.test(vehicleId)) throw new CheckoutError("Choose a car again.", 400);
    if (!start || !end) throw new CheckoutError("Choose pickup and return dates.", 400);
    if (name.length < 2) throw new CheckoutError("Enter the driver's full name.", 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CheckoutError("Enter a valid email.", 400);
    if (phone.length < 5) throw new CheckoutError("Enter a phone number.", 400);
    if (!Number.isInteger(age) || age < 18 || age > 99) {
      throw new CheckoutError("Enter the driver's age.", 400);
    }

    const selection = readSelection(body.selection);
    selection.driverAge = age;

    const detail = await getPublicCar({ vehicleId, start, end });
    if (!detail.car.available) {
      throw new CheckoutError("This car was just taken for those dates. Pick another car or different dates.", 409);
    }
    const offer = detail.offer;
    if (offer && detail.days < offer.minRentalDays) {
      throw new CheckoutError(`This company rents for at least ${offer.minRentalDays} days.`, 400);
    }
    if (offer && age < offer.minDriverAge) {
      throw new CheckoutError(`This company rents to drivers aged ${offer.minDriverAge} and over.`, 400);
    }

    const insuranceOk = offer
      ? offer.insurance.some((row) => row.code === selection.insuranceCode)
      : selection.insuranceCode === "none";
    if (!insuranceOk) throw new CheckoutError("Choose Basic or Full insurance.", 400);

    const pickup = offer?.places.find((place) => place.id === selection.pickupPlaceId) ?? null;
    const dropoff = offer?.places.find((place) => place.id === selection.returnPlaceId) ?? pickup;
    if (offer && offer.places.length > 0) {
      if (!pickup?.pickupAllowed) throw new CheckoutError("Choose a pickup place.", 400);
      if (!dropoff?.returnAllowed) throw new CheckoutError("Choose a return place.", 400);
    }
    if (pickup?.kind === "city" && deliveryLabel.length < 3) {
      throw new CheckoutError("Choose the delivery address from the list.", 400);
    }
    const collection = dropoff?.kind === "city"
      ? (sameAddress && pickup?.kind === "city" ? deliveryLabel : collectionLabel)
      : "";
    if (dropoff?.kind === "city" && collection.length < 3) {
      throw new CheckoutError("Choose the collection address from the list.", 400);
    }

    const quote = quoteOffer(detail.car.dailyRate, detail.days, offer, selection);
    const seats = selection.childSeatInfant || selection.childSeatToddler || selection.childSeatChild;
    const line = (id: string) => quote.lines.some((row) => row.id === id);
    requirePriced(seats, line("child-seat"), "Child seats are not offered for this car.");
    requirePriced(selection.additionalDriver, line("additional-driver"), "An additional driver is not offered.");
    requirePriced(selection.gps, line("gps"), "GPS is not offered.");
    requirePriced(selection.airportDelivery, line("airport-delivery"), "Airport delivery is not offered.");
    requirePriced(selection.crossBorder, line("cross-border"), "Cross-border travel is not offered.");

    const stripe = getStripe();
    if (!stripe) {
      throw new CheckoutError("Card payments are not switched on yet. The Stripe secret key is missing.", 503);
    }

    const fee = roundMoney(quote.platformFee);
    const rental = roundMoney(quote.rentalTotal);
    const holdUntil = new Date(Date.now() + (PENDING_PAYMENT_HOLD_MINUTES * 60 + 90) * 1000);
    const deposit = selection.insuranceCode === "full" ? 0 : detail.car.depositBasic;
    const db = createServiceRoleClient();

    const { data: existingCustomer, error: existingError } = await db
      .from("customers")
      .select("id")
      .eq("company_id", detail.car.companyId)
      .eq("phone", phone)
      .maybeSingle();
    if (existingError) throw existingError;

    let customerId = existingCustomer?.id ?? null;
    if (customerId) {
      const { error: updateError } = await db
        .from("customers")
        .update({ full_name: name, email, updated_at: new Date().toISOString() })
        .eq("id", customerId);
      if (updateError) throw updateError;
    } else {
      const { data: customer, error: customerError } = await db
        .from("customers")
        .insert({
          company_id: detail.car.companyId,
          full_name: name,
          email,
          phone,
        })
        .select("id")
        .single();
      if (customerError || !customer) throw customerError ?? new CheckoutError("Could not save the driver.", 500);
      customerId = customer.id;
    }

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .insert({
        company_id: detail.car.companyId,
        customer_id: customerId,
        vehicle_id: detail.car.id,
        listed_vehicle_id: detail.car.id,
        source: "online",
        status: "pending_payment",
        start_at: detail.start,
        end_at: detail.end,
        pending_expires_at: holdUntil.toISOString(),
        insurance: selection.insuranceCode as InsuranceCode,
        child_seat_infant: selection.childSeatInfant,
        child_seat_toddler: selection.childSeatToddler,
        child_seat_child: selection.childSeatChild,
        booking_price: rental,
        rental_total: rental,
        platform_fee: fee,
        deposit_amount: deposit,
        deposit_paid: false,
        pickup_location: pickup ? placeLine(pickup, "pickup", deliveryLabel, flightOk) : null,
        return_location: dropoff ? placeLine(dropoff, "return", collection, "") : null,
        flight_number: flightOk || null,
        customer_request: customerRequest || null,
        customer_cancel_token: randomBytes(24).toString("base64url"),
        is_longterm: false,
        is_maintenance: false,
      })
      .select("id")
      .single();
    if (bookingError || !booking) throw bookingError ?? new CheckoutError("Could not hold the car.", 500);

    const origin = publicSiteOrigin(request);
    const back = new URLSearchParams({
      start: detail.start,
      end: detail.end,
      pickupTime: selection.pickupTime,
      returnTime: selection.returnTime,
    });
    const extra = selectionQuery(selection);
    const cancelUrl = `${origin}/book/${detail.car.id}/checkout?${back.toString()}${extra ? `&${extra}` : ""}`;

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        client_reference_id: booking.id,
        expires_at: Math.floor(holdUntil.getTime() / 1000),
        success_url: `${origin}/book/confirmed?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: { booking_id: booking.id },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(fee * 100),
              product_data: {
                name: `Booking confirmation · ${carTitle(detail.car)}`,
                description: `${detail.days} ${detail.days === 1 ? "day" : "days"} with ${detail.car.companyName}. The rental is paid at pickup.`,
              },
            },
          },
        ],
      });

      if (!session.url) {
        await releaseUnpaidHold(booking.id);
        throw new CheckoutError("The card page could not be opened. Nothing was charged.", 502);
      }

      const { error: sessionError } = await db
        .from("bookings")
        .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
        .eq("id", booking.id)
        .eq("status", "pending_payment");
      if (sessionError) {
        await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
        await releaseUnpaidHold(booking.id);
        throw sessionError;
      }

      return NextResponse.json({ url: session.url });
    } catch (err) {
      if (err instanceof CheckoutError) throw err;
      await releaseUnpaidHold(booking.id);
      console.error("[booking/checkout] stripe", err);
      const rejected = err && typeof err === "object" && "type" in err && err.type === "StripeAuthenticationError";
      if (rejected) {
        throw new CheckoutError("The Stripe secret key was rejected. Check STRIPE_SECRET_KEY.", 503);
      }
      throw new CheckoutError("The card page could not be opened. Nothing was charged.", 502);
    }
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof BookingSearchError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[booking/checkout]", err);
    return NextResponse.json({ error: "Could not start the card payment." }, { status: 500 });
  }
}
