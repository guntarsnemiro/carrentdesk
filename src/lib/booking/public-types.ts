export type PublicBookableCar = {
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  make: string;
  model: string;
  year: number;
  seats: number | null;
  fuel: string | null;
  category: string;
  photoUrls: string[];
  depositBasic: number | null;
  depositPartial: number | null;
  dailyRate: number;
  days: number;
  rentalTotal: number;
  platformFee: number;
  available: boolean;
};

export type AvailableCarsResult = {
  city?: string;
  companyId?: string;
  companyName?: string;
  slug?: string;
  start: string;
  end: string;
  days: number;
  cars: PublicBookableCar[];
};

export function carTitle(car: Pick<PublicBookableCar, "make" | "model">): string {
  return `${car.make} ${car.model} or similar`;
}

export function matchesPublicType(
  car: Pick<PublicBookableCar, "category" | "fuel" | "seats">,
  type: string | undefined,
): boolean {
  if (!type || type === "any") return true;
  if (type === "electric") return car.fuel === "electric" || car.fuel === "hybrid";
  if (type === "nine_seater") return (car.seats ?? 0) >= 9;
  if (type === "economy") return car.category === "economy" || car.category === "compact";
  if (type === "mid_size") return car.category === "midsize";
  if (type === "suv") return car.category === "suv";
  if (type === "van") return car.category === "van";
  return true;
}

export function fuelLabel(fuel: string | null): string | null {
  if (!fuel) return null;
  return fuel.charAt(0).toUpperCase() + fuel.slice(1);
}

const CATEGORY_LABELS: Record<string, string> = {
  economy: "Economy",
  compact: "Compact",
  midsize: "Mid-size",
  suv: "SUV",
  van: "Van",
  luxury: "Luxury",
  other: "Car",
};

export function categoryLabel(category: string | null): string | null {
  if (!category) return null;
  return CATEGORY_LABELS[category] ?? category;
}
