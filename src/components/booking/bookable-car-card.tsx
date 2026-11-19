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

function PriceRow({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-neutral-500">{label}</p>
        {hint ? <p className="text-[11px] text-neutral-400">{hint}</p> : null}
      </div>
      <p
        className={
          emphasize
            ? "shrink-0 text-sm font-semibold tabular-nums text-brand-900"
            : "shrink-0 text-sm font-medium tabular-nums text-brand-950"
        }
      >
        {value}
      </p>
    </div>
  );
}

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
  const dayLabel = `${car.days} ${car.days === 1 ? "day" : "days"}`;
  const depositLabel =
    car.depositBasic != null ? formatEur(car.depositBasic) : "See details";

  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-xl bg-background p-3 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200 lg:flex-col lg:gap-0 lg:p-0 lg:overflow-hidden"
    >
      {/* Photo — thumbnail on mobile, short strip on desktop */}
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-soft lg:aspect-[16/9] lg:h-auto lg:w-full lg:rounded-none">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={carTitle(car)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-neutral-400">No photo</div>
        )}
        <span className="absolute left-2 top-2 hidden rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-brand-900 ring-1 ring-brand-200 lg:inline">
          Book online
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 lg:gap-3 lg:p-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-brand-950 lg:text-base">
            {carTitle(car)}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-500 lg:text-sm">
            {bits.join(" · ")}
          </p>
          <p className="text-xs text-neutral-500">{car.companyName}</p>
        </div>

        <div className="space-y-1.5 rounded-lg bg-surface-soft/80 px-2.5 py-2 ring-1 ring-border/60 lg:px-3">
          <PriceRow
            label="Trip total"
            hint={`${dayLabel} · pay at pickup`}
            value={formatEur(car.rentalTotal)}
            emphasize
          />
          <PriceRow
            label="Pay now"
            hint="Card · confirms booking"
            value={formatEur(car.platformFee)}
          />
          <PriceRow
            label="Deposit"
            hint="At pickup · not pay now"
            value={depositLabel}
          />
        </div>

        <p className="text-[11px] leading-snug text-neutral-500">
          Pay {formatEur(car.platformFee)} now to confirm. Pay{" "}
          {formatEur(car.rentalTotal)} to the office at pickup.
        </p>

        <span className="mt-auto inline-flex w-full items-center justify-center rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white group-hover:bg-brand-800 lg:mt-1">
          Choose
        </span>
      </div>
    </Link>
  );
}
