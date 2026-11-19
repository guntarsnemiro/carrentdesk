"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookableCarCard } from "@/components/booking/bookable-car-card";
import { DateRangeBar } from "@/components/booking/date-range-bar";
import {
  addDaysYmd,
  defaultPickupYmd,
  defaultReturnYmd,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  formatDateRange,
  isValidDateTimeRange,
  isValidRange,
  ymdToIso,
} from "@/lib/booking/dates";
import { matchesPublicType, type AvailableCarsResult } from "@/lib/booking/public-types";
import { VEHICLE_TYPES } from "@/lib/vehicle-types";

type Props = {
  citySlug: string;
  cityName: string;
  companySlug?: string;
};

export function BookableCarsSection({ citySlug, cityName, companySlug }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlPickup = searchParams.get("pickup") ?? "";
  const urlReturn = searchParams.get("return") ?? "";
  const urlPickupTime = searchParams.get("pickupTime") ?? "";
  const urlReturnTime = searchParams.get("returnTime") ?? "";
  const typeParam = searchParams.get("type") ?? undefined;

  const [defaults] = useState(() => {
    const pickup = defaultPickupYmd();
    return {
      pickup,
      returnDate: defaultReturnYmd(pickup),
      pickupTime: DEFAULT_PICKUP_TIME,
      returnTime: DEFAULT_RETURN_TIME,
    };
  });
  const appliedPickup = urlPickup || defaults.pickup;
  const appliedReturn =
    urlReturn && isValidRange(appliedPickup, urlReturn)
      ? urlReturn
      : urlPickup
        ? defaultReturnYmd(urlPickup)
        : defaults.returnDate;
  const appliedPickupTime = urlPickupTime || defaults.pickupTime;
  const appliedReturnTime = urlReturnTime || defaults.returnTime;

  const [pickup, setPickup] = useState(appliedPickup);
  const [returnDate, setReturnDate] = useState(appliedReturn);
  const [pickupTime, setPickupTime] = useState(appliedPickupTime);
  const [returnTime, setReturnTime] = useState(appliedReturnTime);
  const [result, setResult] = useState<AvailableCarsResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCars = useCallback(
    async (startYmd: string, endYmd: string, startTime: string, endTime: string) => {
      if (!isValidDateTimeRange(startYmd, startTime, endYmd, endTime)) {
        setError("Return must be after pickup.");
        setResult(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        start: ymdToIso(startYmd, startTime),
        end: ymdToIso(endYmd, endTime),
      });
      if (companySlug) params.set("slug", companySlug);
      else params.set("city", citySlug);

      try {
        const res = await fetch(`/api/booking/available?${params}`);
        const data = (await res.json()) as AvailableCarsResult & { error?: string };
        if (!res.ok) {
          setError(data.error || "Could not load cars.");
          setResult(null);
          return;
        }
        setResult(data);
      } catch {
        setError("Could not load cars.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [citySlug, companySlug],
  );

  useEffect(() => {
    void fetchCars(appliedPickup, appliedReturn, appliedPickupTime, appliedReturnTime);
  }, [appliedPickup, appliedReturn, appliedPickupTime, appliedReturnTime, fetchCars]);

  useEffect(() => {
    if (urlPickup) setPickup(urlPickup);
    if (urlReturn) setReturnDate(urlReturn);
    if (urlPickupTime) setPickupTime(urlPickupTime);
    if (urlReturnTime) setReturnTime(urlReturnTime);
  }, [urlPickup, urlReturn, urlPickupTime, urlReturnTime]);

  function writeWhen(next: {
    pickup: string;
    returnDate: string;
    pickupTime: string;
    returnTime: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pickup", next.pickup);
    params.set("return", next.returnDate);
    params.set("pickupTime", next.pickupTime);
    params.set("returnTime", next.returnTime);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onPickupChange(value: string) {
    setPickup(value);
    const nextReturn = isValidDateTimeRange(value, pickupTime, returnDate, returnTime)
      ? returnDate
      : addDaysYmd(value, 3);
    if (nextReturn !== returnDate) setReturnDate(nextReturn);
  }

  function onPickupTimeChange(value: string) {
    setPickupTime(value);
    if (!isValidDateTimeRange(pickup, value, returnDate, returnTime)) {
      setReturnDate(addDaysYmd(pickup, 3));
    }
  }

  const cars = useMemo(() => {
    const list = result?.cars ?? [];
    return list.filter((car) => matchesPublicType(car, typeParam));
  }, [result, typeParam]);

  const typeLabel = VEHICLE_TYPES.find((v) => v.key === typeParam)?.label;
  const validApplied = isValidDateTimeRange(
    appliedPickup,
    appliedPickupTime,
    appliedReturn,
    appliedReturnTime,
  );
  const startIso = result?.start ?? (validApplied ? ymdToIso(appliedPickup, appliedPickupTime) : "");
  const endIso = result?.end ?? (validApplied ? ymdToIso(appliedReturn, appliedReturnTime) : "");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
          Live booking · {cityName}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-brand-950">
          {companySlug ? "Choose dates and a car" : "Cars you can book now"}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600">
          Each car shows trip total, what you pay now, and deposit. Pay a small card fee to confirm — the rental is paid to the office at pickup.
        </p>
      </div>

      <DateRangeBar
        pickup={pickup}
        returnDate={returnDate}
        pickupTime={pickupTime}
        returnTime={returnTime}
        onPickupChange={onPickupChange}
        onReturnChange={setReturnDate}
        onPickupTimeChange={onPickupTimeChange}
        onReturnTimeChange={setReturnTime}
        onSubmit={() => writeWhen({ pickup, returnDate, pickupTime, returnTime })}
        submitting={loading}
      />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl bg-surface-soft ring-1 ring-border lg:h-80"
            />
          ))}
        </div>
      )}

      {!loading && !error && result && (
        <>
          <p className="text-sm text-neutral-600">
            {cars.length === 0
              ? typeLabel
                ? `No ${typeLabel.toLowerCase()} cars free ${formatDateRange(appliedPickup, appliedReturn)}.`
                : `No cars free ${formatDateRange(appliedPickup, appliedReturn)}.`
              : `${cars.length} ${cars.length === 1 ? "car" : "cars"} · ${formatDateRange(appliedPickup, appliedReturn)} · ${appliedPickupTime}–${appliedReturnTime} · ${result.days} ${result.days === 1 ? "day" : "days"}`}
          </p>
          {cars.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
              {cars.map((car) => (
                <BookableCarCard
                  key={car.id}
                  car={car}
                  startIso={startIso}
                  endIso={endIso}
                  pickupYmd={appliedPickup}
                  returnYmd={appliedReturn}
                  pickupTime={appliedPickupTime}
                  returnTime={appliedReturnTime}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-surface-soft p-8 text-center">
              <p className="text-sm text-neutral-600">
                Try other dates{typeLabel ? " or another car type" : ""}. Other local rentals are listed below — you can still contact them directly.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
