import Link from "next/link";
import { carTitle, fuelLabel, type PublicBookableCar } from "@/lib/booking/public-types";
import { formatEur } from "@/lib/booking/money";

type Props = {
  car: PublicBookableCar;
  startIso: string;
  endIso: string;
  pickupYmd: string;
  returnYmd: string;
  pickupTime: string;
  returnTime: string;
};

export function BookableCarCard({
  car,
  startIso,
  endIso,
  pickupYmd,
  returnYmd,
  pickupTime,
  returnTime,
}: Props) {
  const photo = car.photoUrls[0];
  const href = `/book/${car.id}?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}&pickup=${pickupYmd}&return=${returnYmd}&pickupTime=${encodeURIComponent(pickupTime)}&returnTime=${encodeURIComponent(returnTime)}`;
  const bits = [
    String(car.year),
    car.seats ? `${car.seats} seats` : null,
    fuelLabel(car.fuel),
  ].filter(Boolean);

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl bg-background ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-soft">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={carTitle(car)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-neutral-400">No photo</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-medium text-brand-900 shadow-sm ring-1 ring-brand-200">
          Book online
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-brand-950">
            {carTitle(car)}
          </h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            {bits.join(" · ")} · {car.companyName}
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Rental · {car.days} {car.days === 1 ? "day" : "days"}
            </p>
            <p className="text-lg font-semibold tracking-tight text-brand-950">
              {formatEur(car.rentalTotal)}
            </p>
            <p className="text-xs text-neutral-500">Paid at pickup</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Pay now
            </p>
            <p className="text-lg font-semibold tracking-tight text-brand-900">
              {formatEur(car.platformFee)}
            </p>
            <p className="text-xs text-neutral-500">Card fee</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
