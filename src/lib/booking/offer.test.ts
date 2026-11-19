import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cappedAmount, isOutsideHours, quoteOffer, rateForDays, type PublicOffer } from "./offer";

// ── Legacy 5-rate per-day tier system (rate23/rate46 set) ───────────────────
const tieredRates = { rate1: 40, rate23: 32, rate46: 28, rateWeekly: 24, rateMonthly: 18 };

describe("rateForDays — 5-rate tier system", () => {
  it("uses the band for the rental length and falls back when a longer band is empty", () => {
    assert.equal(rateForDays(tieredRates, 1), 40);
    assert.equal(rateForDays(tieredRates, 3), 32);
    assert.equal(rateForDays(tieredRates, 5), 28);
    assert.equal(rateForDays(tieredRates, 10), 24);
    assert.equal(rateForDays(tieredRates, 30), 18);
    assert.equal(rateForDays({ ...tieredRates, rateWeekly: null, rateMonthly: null }, 14), 28);
  });
});

// ── New 3-rate flat-package system (rate23/rate46 null) ──────────────────────
// rateWeekly / rateMonthly are flat fees for 7 / 30 days.
// System converts them to per-day equivalents and always uses the cheapest.

describe("rateForDays — 3-rate flat-package system", () => {
  const round = (n: number) => Math.round(n * 100) / 100;

  // weekly only: €250 flat → €35.71/day
  // daily €45 → weekly wins for any duration
  const weeklyOnly = { rate1: 45, rate23: null, rate46: null, rateWeekly: 250, rateMonthly: null };

  it("uses weekly per-day (250/7 ≈ 35.71) which beats daily €45", () => {
    assert.equal(round(rateForDays(weeklyOnly, 1)!), round(250 / 7)); // even 1 day
    assert.equal(round(rateForDays(weeklyOnly, 6)!), round(250 / 7));
  });

  it("produces €250 total for exactly 7 days", () => {
    assert.equal(round(rateForDays(weeklyOnly, 7)! * 7), 250);
  });

  it("produces €250 + one weekly-day for 8 days (285.71)", () => {
    // 8 × (250/7) = 285.71
    assert.equal(round(rateForDays(weeklyOnly, 8)! * 8), round((250 / 7) * 8));
  });

  // all 3 rates: monthly/30 = 26.67/day is cheapest overall
  const allFlat = { rate1: 45, rate23: null, rate46: null, rateWeekly: 250, rateMonthly: 800 };

  it("uses monthly per-day (800/30 ≈ 26.67) when it is the cheapest", () => {
    assert.equal(round(rateForDays(allFlat, 1)!), round(800 / 30));
  });

  it("produces €800 total for exactly 30 days", () => {
    assert.equal(round(rateForDays(allFlat, 30)! * 30), 800);
  });

  it("produces €800 + 5 monthly-days for 35 days (933.33)", () => {
    // 35 × (800/30) = 933.33
    assert.equal(round(rateForDays(allFlat, 35)! * 35), round((800 / 30) * 35));
  });

  it("falls back to daily rate when no weekly or monthly is set", () => {
    assert.equal(rateForDays({ rate1: 45, rate23: null, rate46: null, rateWeekly: null, rateMonthly: null }, 7), 45);
  });

  it("uses only daily when it is the cheapest", () => {
    // weekly = €700 → €100/day, more expensive than daily €45 → use daily
    assert.equal(rateForDays({ rate1: 45, rate23: null, rate46: null, rateWeekly: 700, rateMonthly: null }, 1), 45);
  });
});

describe("quoteOffer", () => {
  const offer: PublicOffer = {
    depositPayCash: true,
    depositPayCard: false,
    depositReturnedWhen: "When the car is returned",
    creditCardRequired: false,
    payCash: true,
    payCard: true,
    payTransfer: false,
    minDriverAge: 21,
    unlimitedKm: false,
    kmPerDay: 200,
    extraKmPrice: 0.2,
    fuelPolicy: "full_to_full",
    minRentalDays: 1,
    oneWayFee: 30,
    pricesIncludeVat: true,
    crossBorderAllowed: true,
    crossBorder: { perDay: null, max: 40 },
    crossBorderCountries: ["Estonia"],
    childSeat: { perDay: 6, max: 20 },
    additionalDriver: { perDay: 8, max: null },
    gps: { perDay: null, max: null },
    airportDelivery: { perDay: null, max: null },
    cityDeliveryEnabled: true,
    cityDeliveryPrice: 20,
    insurance: [
      { code: "none", label: "Basic", price: 0, priceKind: "per_day", excess: 800 },
      { code: "partial", label: "Partial", price: 8, priceKind: "per_day", excess: 400 },
      { code: "full", label: "Full", price: 15, priceKind: "per_day", excess: 0 },
    ],
    places: [
      {
        id: "office",
        name: "Office",
        address: "Riga",
        kind: "office",
        iataCode: null,
        pickupAllowed: true,
        returnAllowed: true,
        deliveryFee: null,
        opensAt: "09:00",
        closesAt: "18:00",
        afterHoursFee: 25,
      },
      {
        id: "airport",
        name: "Riga Airport (RIX)",
        address: "Riga Airport (RIX)",
        kind: "airport",
        iataCode: "RIX",
        pickupAllowed: true,
        returnAllowed: true,
        deliveryFee: 15,
        opensAt: "06:00",
        closesAt: "22:00",
        afterHoursFee: null,
      },
    ],
  };

  it("adds insurance, a seat, and the card fee minimum", () => {
    const quote = quoteOffer(40, 1, offer, {
      insuranceCode: "partial",
      pickupPlaceId: "office",
      returnPlaceId: "office",
      childSeatInfant: true,
      childSeatToddler: false,
      childSeatChild: false,
      additionalDriver: false,
      gps: false,
      airportDelivery: false,
      crossBorder: false,
      driverAge: 30,
      pickupTime: "10:00",
      returnTime: "10:00",
    });
    assert.equal(quote.rentalTotal, 40 + 8 + 6);
    assert.equal(quote.platformFee, 19);
  });

  it("uses 10% once the rental is over €190 and charges after-hours and one-way", () => {
    const quote = quoteOffer(40, 8, offer, {
      insuranceCode: "none",
      pickupPlaceId: "office",
      returnPlaceId: "airport",
      childSeatInfant: false,
      childSeatToddler: false,
      childSeatChild: false,
      additionalDriver: true,
      gps: false,
      airportDelivery: false,
      crossBorder: true,
      driverAge: 23,
      pickupTime: "07:00",
      returnTime: "12:00",
    });
    const car = 40 * 8;
    const driver = 8 * 8;
    assert.equal(quote.rentalTotal, car + driver + 40 + 25 + 30);
    assert.equal(quote.platformFee, Math.round(quote.rentalTotal * 0.1 * 100) / 100);
  });

  it("caps a daily extra at the rental total", () => {
    assert.equal(cappedAmount({ perDay: 6, max: 20 }, 8), 20);
    assert.equal(cappedAmount({ perDay: 6, max: null }, 2), 12);
    assert.equal(cappedAmount({ perDay: null, max: 25 }, 8), 25);
  });

  it("charges city delivery and city collection separately, and uses office hours", () => {
    const withCity = {
      ...offer,
      places: [
        ...offer.places,
        {
          id: "city",
          name: "City delivery",
          address: "",
          kind: "city" as const,
          iataCode: null,
          pickupAllowed: true,
          returnAllowed: true,
          deliveryFee: null,
          opensAt: "09:00",
          closesAt: "18:00",
          afterHoursFee: 25,
        },
      ],
    };
    const both = quoteOffer(40, 1, withCity, {
      insuranceCode: "none",
      pickupPlaceId: "city",
      returnPlaceId: "city",
      childSeatInfant: false,
      childSeatToddler: false,
      childSeatChild: false,
      additionalDriver: false,
      gps: false,
      airportDelivery: false,
      crossBorder: false,
      driverAge: 30,
      pickupTime: "07:00",
      returnTime: "12:00",
    });
    assert.equal(both.rentalTotal, 40 + 20 + 20 + 25);
    assert.equal(both.lines.some((line) => line.id === "one-way"), false);

    const mixed = quoteOffer(40, 1, withCity, {
      insuranceCode: "none",
      pickupPlaceId: "city",
      returnPlaceId: "office",
      childSeatInfant: false,
      childSeatToddler: false,
      childSeatChild: false,
      additionalDriver: false,
      gps: false,
      airportDelivery: false,
      crossBorder: false,
      driverAge: 30,
      pickupTime: "10:00",
      returnTime: "10:00",
    });
    assert.equal(mixed.rentalTotal, 40 + 20 + 30);
  });
});

describe("isOutsideHours", () => {
  it("treats a time before opening as after hours", () => {
    assert.equal(isOutsideHours("07:00", "09:00", "18:00"), true);
    assert.equal(isOutsideHours("10:00", "09:00", "18:00"), false);
    assert.equal(isOutsideHours("10:00", null, null), false);
  });
});
