"use client";

export interface OdometerReading { km: number; date: string; source: string; }

export function OdometerHint({ reading }: { reading: OdometerReading }) {
  const date = new Date(reading.date);
  const daysAgo = Math.floor((Date.now() - date.getTime()) / 86400000);
  const fmtDate = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const ageText = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;
  const isStale = daysAgo > 30;
  const sourceLabel = reading.source === "maintenance" ? "from service" : reading.source === "booking" ? "from booking" : "manual";
  return (
    <p className={`mt-1 text-xs ${isStale ? "text-amber-600" : "text-neutral-400"}`}>
      Last reading: <span className="font-semibold">{reading.km.toLocaleString()} km</span>
      {" · "}{fmtDate} ({ageText}){" · "}{sourceLabel}
      {isStale && " ⚠ update odometer"}
    </p>
  );
}
