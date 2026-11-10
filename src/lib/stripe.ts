import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Server-side Stripe client. Null until STRIPE_SECRET_KEY is set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

/**
 * Where Stripe sends the customer after payment.
 * Localhost uses the request host. Anywhere else uses NEXT_PUBLIC_SITE_URL
 * so a forged Origin header cannot steal the return trip.
 */
export function publicSiteOrigin(request: Request): string {
  const host = request.headers.get("host") ?? "";
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  if (local) {
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return configured || "https://carrentdesk.com";
}
