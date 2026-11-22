"use client";

import { useEffect } from "react";
import { recordListingView } from "@/lib/booking/demand-client";

export function ListingView({ slug }: { slug: string }) {
  useEffect(() => {
    recordListingView(slug);
  }, [slug]);
  return null;
}
