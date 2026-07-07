"use client";

import { trackContact } from "@/lib/analytics";
import type { Listing } from "@/lib/listings";

export function ContactCTAs({
  listing,
  cityName,
}: {
  listing: Listing;
  cityName: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {listing.phone && (
        <a
          href={`tel:${listing.phone.replace(/\s+/g, "")}`}
          onClick={() =>
            trackContact({
              companyName: listing.name,
              companySlug: listing.slug,
              city: cityName,
              contactType: "phone",
            })
          }
          className="inline-flex items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          Call {listing.phone}
        </a>
      )}
      {listing.whatsapp && (
        <a
          href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`}
          onClick={() =>
            trackContact({
              companyName: listing.name,
              companySlug: listing.slug,
              city: cityName,
              contactType: "whatsapp",
            })
          }
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-surface-soft"
        >
          WhatsApp
        </a>
      )}
      {listing.website && (
        <a
          href={listing.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackContact({
              companyName: listing.name,
              companySlug: listing.slug,
              city: cityName,
              contactType: "website",
            })
          }
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-surface-soft"
        >
          Visit website
        </a>
      )}
    </div>
  );
}
