"use client";

export function LocalTime({ iso }: { iso: string }) {
  return (
    <>{new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}</>
  );
}
