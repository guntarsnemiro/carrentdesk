declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type ContactType = "phone" | "whatsapp" | "website" | "email";

/**
 * Fire a GA4 `contact_click` event whenever a visitor taps a contact button
 * on a company profile. Safe to call on the server (no-op if gtag isn't loaded).
 */
export function trackContact({
  companyName,
  companySlug,
  city,
  contactType,
}: {
  companyName: string;
  companySlug: string;
  city: string;
  contactType: ContactType;
}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "contact_click", {
    company_name: companyName,
    company_slug: companySlug,
    city,
    contact_type: contactType,
  });
}
