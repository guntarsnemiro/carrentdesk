import { platformFee, rentalTotal, roundMoney } from "@/lib/booking/platform-fee";

export type InsuranceCode = "none" | "partial" | "full";
export type PriceKind = "per_day" | "flat";
export type FuelPolicy = "full_to_full" | "full_to_empty" | "same_to_same";

export type VehicleRates = {
  rate1: number | null;
  rate23: number | null;
  rate46: number | null;
  rateWeekly: number | null;
  rateMonthly: number | null;
};

export type InsuranceOption = {
  code: InsuranceCode;
  label: string;
  price: number;
  priceKind: PriceKind;
  excess: number;
};

export type PlaceKind = "office" | "airport" | "city";

/** Virtual pickup/return place for delivery and collection inside the rental's city. */
export const CITY_PLACE_ID = "city";

export type OfferPlace = {
  id: string;
  name: string;
  address: string;
  kind: PlaceKind;
  iataCode: string | null;
  pickupAllowed: boolean;
  returnAllowed: boolean;
  deliveryFee: number | null;
  opensAt: string | null;
  closesAt: string | null;
  afterHoursFee: number | null;
};

export function placeLabel(place: OfferPlace, side: "pickup" | "return"): string {
  if (place.kind === "city") return side === "pickup" ? "City delivery" : "City collection";
  return place.name || place.address;
}

/** A daily price, a cap for the whole rental, or both. The charge is the lower of the two when both are set. */
export type CappedPrice = {
  perDay: number | null;
  max: number | null;
};

export type PublicOffer = {
  depositPayCash: boolean;
  depositPayCard: boolean;
  depositReturnedWhen: string | null;
  creditCardRequired: boolean;
  payCash: boolean;
  payCard: boolean;
  payTransfer: boolean;
  minDriverAge: number;
  unlimitedKm: boolean;
  kmPerDay: number | null;
  extraKmPrice: number | null;
  fuelPolicy: FuelPolicy;
  minRentalDays: number;
  oneWayFee: number | null;
  pricesIncludeVat: boolean;
  crossBorderAllowed: boolean;
  crossBorder: CappedPrice;
  crossBorderCountries: string[];
  childSeat: CappedPrice;
  additionalDriver: CappedPrice;
  gps: CappedPrice;
  airportDelivery: CappedPrice;
  cityDeliveryEnabled: boolean;
  cityDeliveryPrice: number | null;
  insurance: InsuranceOption[];
  places: OfferPlace[];
};

export function cappedAmount(price: CappedPrice, days: number, count = 1): number | null {
  if (price.perDay == null && price.max == null) return null;
  if (price.perDay == null) return roundMoney(price.max ?? 0);
  const fromDays = price.perDay * days * count;
  if (price.max == null) return roundMoney(fromDays);
  return roundMoney(Math.min(fromDays, price.max));
}

export function hasCappedPrice(price: CappedPrice): boolean {
  return price.perDay != null || price.max != null;
}

export type OfferSelection = {
  insuranceCode: InsuranceCode;
  pickupPlaceId: string | null;
  returnPlaceId: string | null;
  childSeatInfant: boolean;
  childSeatToddler: boolean;
  childSeatChild: boolean;
  additionalDriver: boolean;
  gps: boolean;
  airportDelivery: boolean;
  crossBorder: boolean;
  driverAge: number | null;
  pickupTime: string;
  returnTime: string;
};

export type QuoteLine = { id: string; label: string; amount: number };

export type OfferQuote = {
  days: number;
  dailyRate: number;
  lines: QuoteLine[];
  rentalTotal: number;
  platformFee: number;
};

const INSURANCE_ORDER: InsuranceCode[] = ["none", "partial", "full"];

export function rateForDays(rates: VehicleRates, days: number): number | null {
  const hasDetailedTiers =
    (rates.rate23 != null && rates.rate23 > 0) ||
    (rates.rate46 != null && rates.rate46 > 0);

  if (hasDetailedTiers) {
    // ── Legacy 5-rate per-day tier system (fleet editor) ──────────────────
    // rateWeekly and rateMonthly are per-day rates for their respective tiers.
    const chain =
      days >= 28
        ? [rates.rateMonthly, rates.rateWeekly, rates.rate46, rates.rate23, rates.rate1]
        : days >= 7
          ? [rates.rateWeekly, rates.rate46, rates.rate23, rates.rate1]
          : days >= 4
            ? [rates.rate46, rates.rate23, rates.rate1]
            : days >= 2
              ? [rates.rate23, rates.rate1]
              : [rates.rate1];
    for (const r of chain) {
      if (r != null && Number.isFinite(r) && r > 0) return r;
    }
    return null;
  }

  // ── New 3-rate flat-package system (onboarding) ───────────────────────
  // rateWeekly = flat fee for 7 days → per-day = rateWeekly / 7
  // rateMonthly = flat fee for 30 days → per-day = rateMonthly / 30
  // Always use the cheapest per-day equivalent regardless of duration.
  const dailyPerDay = rates.rate1 != null && rates.rate1 > 0 ? rates.rate1 : null;
  const weeklyPerDay =
    rates.rateWeekly != null && rates.rateWeekly > 0 ? rates.rateWeekly / 7 : null;
  const monthlyPerDay =
    rates.rateMonthly != null && rates.rateMonthly > 0 ? rates.rateMonthly / 30 : null;

  const candidates = [dailyPerDay, weeklyPerDay, monthlyPerDay].filter(
    (r): r is number => r != null,
  );
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

function moneyOf(kind: PriceKind, amount: number, days: number): number {
  return kind === "per_day" ? rentalTotal(amount, days) : roundMoney(amount);
}

/** "09:00" or "09:00:00" → minutes from midnight. */
export function timeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function isOutsideHours(time: string, opensAt: string | null, closesAt: string | null): boolean {
  const at = timeToMinutes(time);
  const open = timeToMinutes(opensAt);
  const close = timeToMinutes(closesAt);
  if (at == null || open == null || close == null) return false;
  return at < open || at > close;
}

export function emptySelection(offer: PublicOffer | null, pickupTime: string, returnTime: string): OfferSelection {
  const pickup = offer?.places.find((p) => p.pickupAllowed) ?? null;
  const insurance = offer?.insurance.find((i) => i.code === "none") ?? offer?.insurance[0];
  return {
    insuranceCode: insurance?.code ?? "none",
    pickupPlaceId: pickup?.id ?? null,
    returnPlaceId: pickup?.returnAllowed ? pickup.id : offer?.places.find((p) => p.returnAllowed)?.id ?? pickup?.id ?? null,
    childSeatInfant: false,
    childSeatToddler: false,
    childSeatChild: false,
    additionalDriver: false,
    gps: false,
    airportDelivery: false,
    crossBorder: false,
    driverAge: null,
    pickupTime,
    returnTime,
  };
}

export function quoteOffer(
  dailyRate: number,
  days: number,
  offer: PublicOffer | null,
  selection: OfferSelection,
): OfferQuote {
  const lines: QuoteLine[] = [
    { id: "car", label: "Car rental", amount: rentalTotal(dailyRate, days) },
  ];

  if (offer) {
    const insurance = offer.insurance.find((i) => i.code === selection.insuranceCode);
    if (insurance && insurance.price > 0) {
      lines.push({
        id: `insurance-${insurance.code}`,
        label: insurance.label,
        amount: moneyOf(insurance.priceKind, insurance.price, days),
      });
    }

    const seatCount = [selection.childSeatInfant, selection.childSeatToddler, selection.childSeatChild].filter(Boolean).length;
    const seatAmount = seatCount > 0 ? cappedAmount(offer.childSeat, days, seatCount) : null;
    if (seatAmount != null && seatAmount > 0) {
      lines.push({
        id: "child-seat",
        label: seatCount === 1 ? "Child seat" : `Child seats × ${seatCount}`,
        amount: seatAmount,
      });
    }

    const driverAmount = selection.additionalDriver ? cappedAmount(offer.additionalDriver, days) : null;
    if (driverAmount != null && driverAmount > 0) {
      lines.push({ id: "additional-driver", label: "Additional driver", amount: driverAmount });
    }

    const gpsAmount = selection.gps ? cappedAmount(offer.gps, days) : null;
    if (gpsAmount != null && gpsAmount > 0) {
      lines.push({ id: "gps", label: "GPS", amount: gpsAmount });
    }

    const airportAmount = selection.airportDelivery ? cappedAmount(offer.airportDelivery, days) : null;
    if (airportAmount != null && airportAmount > 0) {
      lines.push({ id: "airport-delivery", label: "Airport delivery", amount: airportAmount });
    }

    const borderAmount = selection.crossBorder && offer.crossBorderAllowed ? cappedAmount(offer.crossBorder, days) : null;
    if (borderAmount != null && borderAmount > 0) {
      lines.push({ id: "cross-border", label: "Cross-border travel", amount: borderAmount });
    }

    const pickup = offer.places.find((p) => p.id === selection.pickupPlaceId) ?? null;
    const ret = offer.places.find((p) => p.id === selection.returnPlaceId) ?? pickup;
    if (pickup?.kind === "city" && offer.cityDeliveryPrice != null && offer.cityDeliveryPrice > 0) {
      lines.push({ id: "city-delivery", label: "City delivery", amount: roundMoney(offer.cityDeliveryPrice) });
    }
    if (pickup && pickup.kind !== "city" && pickup.deliveryFee != null && pickup.deliveryFee > 0) {
      const label = pickup.kind === "airport"
        ? `Airport fee · ${pickup.name || pickup.iataCode}`
        : `Delivery · ${pickup.name || pickup.address}`;
      lines.push({ id: "delivery", label, amount: roundMoney(pickup.deliveryFee) });
    }
    if (ret?.kind === "city" && offer.cityDeliveryPrice != null && offer.cityDeliveryPrice > 0) {
      lines.push({ id: "city-collection", label: "City collection", amount: roundMoney(offer.cityDeliveryPrice) });
    }
    if (pickup && isOutsideHours(selection.pickupTime, pickup.opensAt, pickup.closesAt) && pickup.afterHoursFee != null && pickup.afterHoursFee > 0) {
      lines.push({ id: "after-hours-pickup", label: "After-hours pickup", amount: roundMoney(pickup.afterHoursFee) });
    }
    if (ret && isOutsideHours(selection.returnTime, ret.opensAt, ret.closesAt) && ret.afterHoursFee != null && ret.afterHoursFee > 0) {
      lines.push({ id: "after-hours-return", label: "After-hours return", amount: roundMoney(ret.afterHoursFee) });
    }
    if (pickup && ret && pickup.id !== ret.id && offer.oneWayFee != null && offer.oneWayFee > 0) {
      lines.push({ id: "one-way", label: "Different return place", amount: roundMoney(offer.oneWayFee) });
    }
  }

  const total = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
  return {
    days,
    dailyRate,
    lines,
    rentalTotal: total,
    platformFee: platformFee(total),
  };
}

export function offerGaps(offer: PublicOffer | null, insuranceCount: number, pickupPlaces: number): string[] {
  if (!offer) {
    return ["Save the online offer"];
  }
  const gaps: string[] = [];
  if (pickupPlaces < 1) gaps.push("A pickup place");
  if (insuranceCount < 2) gaps.push("Basic and Full insurance");
  if (!hasCappedPrice(offer.childSeat)) gaps.push("Child seat price");
  if (!hasCappedPrice(offer.additionalDriver)) gaps.push("Additional driver price");
  if (offer.crossBorderAllowed && (!hasCappedPrice(offer.crossBorder) || offer.crossBorderCountries.length === 0)) {
    gaps.push("Cross-border price and countries");
  }
  return gaps;
}

export function fuelPolicyLabel(policy: FuelPolicy): string {
  if (policy === "full_to_empty") return "Full to empty";
  if (policy === "same_to_same") return "Same level to same level";
  return "Full to full";
}

export function sortInsurance(options: InsuranceOption[]): InsuranceOption[] {
  return [...options].sort((a, b) => INSURANCE_ORDER.indexOf(a.code) - INSURANCE_ORDER.indexOf(b.code));
}

export function selectionQuery(selection: OfferSelection): string {
  const params = new URLSearchParams();
  params.set("insurance", selection.insuranceCode);
  if (selection.pickupPlaceId) params.set("pickupPlace", selection.pickupPlaceId);
  if (selection.returnPlaceId) params.set("returnPlace", selection.returnPlaceId);
  const seats = [
    selection.childSeatInfant ? "infant" : "",
    selection.childSeatToddler ? "toddler" : "",
    selection.childSeatChild ? "child" : "",
  ].filter(Boolean);
  if (seats.length) params.set("seats", seats.join(","));
  const extras = [
    selection.additionalDriver ? "additional_driver" : "",
    selection.gps ? "gps" : "",
    selection.airportDelivery ? "airport_delivery" : "",
  ].filter(Boolean);
  if (extras.length) params.set("extras", extras.join(","));
  if (selection.crossBorder) params.set("crossBorder", "1");
  return params.toString();
}

export function selectionFromParams(
  offer: PublicOffer | null,
  pickupTime: string,
  returnTime: string,
  params: { insurance?: string; pickupPlace?: string; returnPlace?: string; seats?: string; extras?: string; crossBorder?: string },
): OfferSelection {
  const selection = emptySelection(offer, pickupTime, returnTime);
  if (params.insurance === "none" || params.insurance === "partial" || params.insurance === "full") {
    selection.insuranceCode = params.insurance;
  }
  if (params.pickupPlace && offer?.places.some((p) => p.id === params.pickupPlace && p.pickupAllowed)) {
    selection.pickupPlaceId = params.pickupPlace;
  }
  if (params.returnPlace && offer?.places.some((p) => p.id === params.returnPlace && p.returnAllowed)) {
    selection.returnPlaceId = params.returnPlace;
  }
  const seats = new Set((params.seats ?? "").split(",").filter(Boolean));
  selection.childSeatInfant = seats.has("infant");
  selection.childSeatToddler = seats.has("toddler");
  selection.childSeatChild = seats.has("child");
  const extras = new Set((params.extras ?? "").split(",").filter(Boolean));
  selection.additionalDriver = extras.has("additional_driver");
  selection.gps = extras.has("gps");
  selection.airportDelivery = extras.has("airport_delivery");
  selection.crossBorder = params.crossBorder === "1" && Boolean(offer?.crossBorderAllowed);
  return selection;
}
