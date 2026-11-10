import { platformFee, roundMoney } from "@/lib/booking/platform-fee";

export type ExtraKind = "per_day" | "flat";

export type PublicExtra = {
  id: string;
  label: string;
  hint: string;
  kind: ExtraKind;
  amount: number;
};

export const PUBLIC_EXTRAS: PublicExtra[] = [
  {
    id: "child_seat",
    label: "Child seat",
    hint: "Infant, toddler, or child seat",
    kind: "per_day",
    amount: 6,
  },
  {
    id: "gps",
    label: "GPS",
    hint: "Portable sat-nav",
    kind: "per_day",
    amount: 5,
  },
  {
    id: "additional_driver",
    label: "Additional driver",
    hint: "Added at pickup",
    kind: "per_day",
    amount: 8,
  },
  {
    id: "airport_delivery",
    label: "Airport delivery (RIX)",
    hint: "Meet at Riga Airport",
    kind: "flat",
    amount: 25,
  },
];

export function extraCost(extra: PublicExtra, days: number): number {
  return extra.kind === "per_day" ? roundMoney(extra.amount * days) : extra.amount;
}

export function extrasTotal(ids: string[], days: number): number {
  return roundMoney(
    PUBLIC_EXTRAS.filter((e) => ids.includes(e.id)).reduce(
      (sum, extra) => sum + extraCost(extra, days),
      0,
    ),
  );
}

export function quoteWithExtras(rentalTotal: number, extraIds: string[], days: number) {
  const extras = extrasTotal(extraIds, days);
  const total = roundMoney(rentalTotal + extras);
  return {
    extras,
    rentalTotal: total,
    platformFee: platformFee(total),
  };
}
