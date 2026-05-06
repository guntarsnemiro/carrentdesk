import Link from "next/link";
import { VEHICLE_TYPES } from "@/lib/vehicle-types";

type Props = {
  /** When provided, links go to /[city]?type=...  Otherwise to /all?type=... */
  citySlug?: string;
};

export function VehicleTypeRow({ citySlug }: Props) {
  const base = citySlug ? `/${citySlug}` : "/all";

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          Browse by car type
        </h2>
        <Link
          href={base}
          className="hidden text-sm font-medium text-brand-700 hover:text-brand-900 sm:inline"
        >
          See all rentals →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
        {VEHICLE_TYPES.map((v) => (
          <Link
            key={v.key}
            href={`${base}?type=${v.key}`}
            className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-background px-3 py-5 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-brand-300 hover:shadow-md"
          >
            <span
              aria-hidden
              className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-900 transition-colors group-hover:bg-brand-100"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={v.iconPath} />
              </svg>
            </span>
            <span className="text-sm font-medium text-brand-950">
              {v.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
