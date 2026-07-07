"use client";

import { trackContact } from "@/lib/analytics";
import type { Listing } from "@/lib/listings";

export function ContactSidebarCard({
  listing,
  cityName,
  claimed,
}: {
  listing: Listing;
  cityName: string;
  claimed: boolean;
}) {
  return (
    <div className="rounded-2xl bg-background p-6 ring-1 ring-border">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Contact directly
      </h3>
      <ul className="mt-3 space-y-3 text-sm">
        {listing.phone && (
          <li>
            <span className="text-neutral-500">Phone</span>
            <br />
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
              className="font-medium text-brand-900 hover:underline"
            >
              {listing.phone}
            </a>
          </li>
        )}
        {listing.whatsapp && (
          <li>
            <span className="text-neutral-500">WhatsApp</span>
            <br />
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
              className="font-medium text-brand-900 hover:underline"
            >
              {listing.whatsapp}
            </a>
          </li>
        )}
        {listing.email && claimed && (
          <li>
            <span className="text-neutral-500">Email</span>
            <br />
            <a
              href={`mailto:${listing.email}`}
              onClick={() =>
                trackContact({
                  companyName: listing.name,
                  companySlug: listing.slug,
                  city: cityName,
                  contactType: "email",
                })
              }
              className="font-medium text-brand-900 hover:underline"
            >
              {listing.email}
            </a>
          </li>
        )}
        {listing.website && (
          <li>
            <span className="text-neutral-500">Website</span>
            <br />
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
              className="font-medium text-brand-900 hover:underline"
            >
              {prettyUrl(listing.website)}
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
