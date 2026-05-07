import Link from "next/link";
import { ListingCard } from "@/components/marketing/listing-card";
import { getFeaturedListings } from "@/lib/listings";

const FEATURED_LIMIT = 3;

export async function FeaturedRentals() {
  const featured = await getFeaturedListings(FEATURED_LIMIT);
  if (featured.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
            Featured rentals
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Verified operators and design partners we&apos;re working with directly.
          </p>
        </div>
        <Link
          href="/all"
          className="hidden text-sm font-medium text-brand-700 hover:text-brand-900 sm:inline"
        >
          See all rentals →
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
