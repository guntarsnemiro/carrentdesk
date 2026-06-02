import { CITIES } from "@/lib/cities";

export function TrustStrip() {
  const totalListings = CITIES.reduce((sum, c) => sum + c.placeholderCount, 0);

  const items = [
    { value: `${totalListings}+`, label: "local rentals" },
    { value: String(CITIES.length), label: "cities in Europe" },
    { value: "0%", label: "commission" },
    { value: "Direct", label: "phone, WhatsApp, email" },
  ];

  return (
    <section className="border-y border-border bg-surface-soft">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-10 gap-y-3 px-6 py-4 lg:px-8">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-baseline gap-2 text-sm text-neutral-700"
          >
            <span className="text-base font-semibold text-brand-950">
              {item.value}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
