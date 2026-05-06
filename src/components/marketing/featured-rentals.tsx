import Link from "next/link";
import { ListingCard } from "@/components/marketing/listing-card";
import { SAMPLE_LISTINGS } from "@/lib/listings";

const FEATURED_LIMIT = 3;

export function FeaturedRentals() {
  const featured = SAMPLE_LISTINGS.slice(0, FEATURED_LIMIT);
  if (featured.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
            Featured in Riga
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Independent rentals our team is in touch with directly.
          </p>
        </div>
        <Link
          href="/riga"
          className="hidden text-sm font-medium text-brand-700 hover:text-brand-900 sm:inline"
        >
          See all Riga rentals →
        </Link>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
