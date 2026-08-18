import "server-only";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// carrentdesk.com is verified in Resend — use it as the sender.
// Override by setting EMAIL_FROM in Vercel env vars if needed.
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "CarRentDesk <info@carrentdesk.com>";
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "info@carrentdesk.com";

/**
 * Returns null when RESEND_API_KEY is not configured (local dev / preview).
 * All callers should handle null gracefully — email is non-critical.
 */
function getResend(): Resend | null {
  if (!RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is not set — emails will not be sent");
    return null;
  }
  return new Resend(RESEND_API_KEY);
}

/**
 * Sends a notification email to the site owner when someone submits
 * the "Request access" form on /for-rentals.
 */
export async function sendAccessRequestNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  city?: string | null;
  fleetBucket?: string | null;
  message?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const fleetLabel: Record<string, string> = {
    fleet_1_10: "1–10 vehicles",
    fleet_11_30: "11–30 vehicles",
    fleet_31_100: "31–100 vehicles",
    fleet_100_plus: "100+ vehicles",
  };

  const lines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    data.companyName ? `Company: ${data.companyName}` : null,
    data.city ? `City: ${data.city}` : null,
    data.fleetBucket ? `Fleet size: ${fleetLabel[data.fleetBucket] ?? data.fleetBucket}` : null,
    data.message ? `\nMessage:\n${data.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  console.log(`[email] sending access request notification to ${OWNER_EMAIL} from ${FROM_ADDRESS}`);
  const accessResult = await resend.emails.send({
    from: FROM_ADDRESS,
    to: OWNER_EMAIL,
    replyTo: data.email,
    subject: `New access request — ${data.companyName ?? data.name} (${data.city ?? "?"})`,
    text: `New access request on CarRentDesk:\n\n${lines}\n\nReply directly to respond to ${data.name}.`,
  });
  if (accessResult.error) {
    console.error("[email] Resend error for access request notification:", accessResult.error);
  } else {
    console.log("[email] access request notification sent, id:", accessResult.data?.id);
  }
}

/**
 * Notifies the site owner when a rental company self-submits a claim request.
 */
export async function sendClaimRequestNotification(data: {
  name: string;
  email: string;
  message?: string;
  companyName: string;
  companySlug: string;
  adminUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  console.log(`[email] sending claim notification to ${OWNER_EMAIL} from ${FROM_ADDRESS}`);
  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: OWNER_EMAIL,
    replyTo: data.email,
    subject: `Claim request — ${data.companyName}`,
    text: [
      `${data.name} (${data.email}) wants to claim the listing for ${data.companyName}.`,
      ``,
      data.message ? `Their message: "${data.message}"` : null,
      ``,
      `Review and approve in the pipeline:`,
      data.adminUrl,
      ``,
      `Reply directly to respond to ${data.name}.`,
    ].filter(Boolean).join("\n"),
  });
  if (result.error) {
    console.error("[email] Resend error for claim notification:", result.error);
  } else {
    console.log("[email] claim notification sent, id:", result.data?.id);
  }
}

/**
 * Sends a claim/registration invitation link to an operator.
 * Called from /api/admin/generate-claim-token when `email` is provided.
 */
export async function sendClaimInvite(data: {
  email: string;
  companyName: string;
  claimUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — skipping invite email to ${data.email}`);
    return;
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.email,
    subject: `You're invited to manage ${data.companyName} on CarRentDesk`,
    text: [
      `Hi,`,
      ``,
      `You've been invited to claim and manage the listing for ${data.companyName} on CarRentDesk — the Baltic car rental marketplace.`,
      ``,
      `Click the link below to register and access your operator dashboard:`,
      ``,
      data.claimUrl,
      ``,
      `This link expires in 30 days. Once you click it, you'll sign in with your email (no password needed) and get instant access to:`,
      `• Your public marketplace listing`,
      `• Fleet management`,
      `• Inspection reports`,
      `• Booking records`,
      ``,
      `Questions? Reply to this email.`,
      ``,
      `— The CarRentDesk team`,
    ].join("\n"),
  });
}

/**
 * Notifies the site owner when an operator completes /join (new listing created).
 */
export async function sendJoinSignupNotification(data: {
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  city: string;
  country: string;
  companySlug: string;
  listingUrl: string;
  adminUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: OWNER_EMAIL,
    replyTo: data.email,
    subject: `New operator signup — ${data.companyName} (${data.city})`,
    text: [
      `${data.contactName} signed up on /join and created a new listing.`,
      ``,
      `Company: ${data.companyName}`,
      `City: ${data.city}, ${data.country}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Listing: ${data.listingUrl}`,
      ``,
      `Pipeline: ${data.adminUrl}`,
    ].join("\n"),
  });
}

/**
 * Notifies the site owner when a customer submits a quote request form.
 */
export async function sendInquiryNotification(data: {
  company_name: string;
  company_slug: string;
  city_slug: string;
  pickup_datetime: string;
  return_datetime: string;
  pickup_location: string;
  return_location?: string;
  vehicle_type: string;
  automatic_transmission?: boolean;
  cross_border: boolean;
  cross_border_countries: string[];
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  driver_age: number;
  payment_method?: string;
  no_deposit: boolean;
  child_seats: number;
  additional_driver: boolean;
  notes?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const vehicleLabels: Record<string, string> = {
    compact: "Compact",
    mid_size: "Mid-size",
    big: "Full-size / Big",
    suv: "SUV",
    minivan: "Minivan (7 seats)",
    bus: "Bus (9 seats)",
    any: "Any / Best price",
  };
  const paymentLabels: Record<string, string> = {
    cash: "Cash",
    debit: "Debit card",
    paypal: "PayPal",
    bank_transfer: "Bank transfer",
    other: "Other",
  };

  const pickup = new Date(data.pickup_datetime);
  const ret = new Date(data.return_datetime);
  const days = Math.round((ret.getTime() - pickup.getTime()) / 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const extras: string[] = [];
  if (data.child_seats > 0) extras.push(`Child seat ×${data.child_seats}`);
  if (data.automatic_transmission) extras.push("Automatic transmission");
  if (data.additional_driver) extras.push("Additional driver");
  if (data.cross_border && data.cross_border_countries.length)
    extras.push(`Cross-border: ${data.cross_border_countries.join(", ")}`);

  const lines = [
    `📩 New quote request — ${data.company_name}`,
    `Company page: https://carrentdesk.com/c/${data.company_slug}`,
    `Admin inbox: https://carrentdesk.com/admin/inquiries`,
    ``,
    `── Trip ──`,
    `Pickup:  ${fmt(pickup)}`,
    `Return:  ${fmt(ret)}  (${days} day${days !== 1 ? "s" : ""})`,
    `Pickup location: ${data.pickup_location}`,
    data.return_location ? `Return location: ${data.return_location}` : null,
    `Car type: ${vehicleLabels[data.vehicle_type] ?? data.vehicle_type}`,
    ``,
    `── Driver ──`,
    `Name:    ${data.customer_name}`,
    `Phone:   ${data.customer_phone}`,
    data.customer_email ? `Email:   ${data.customer_email}` : null,
    `Age:     ${data.driver_age}`,
    ``,
    `── Preferences ──`,
    `Payment: ${data.payment_method ? (paymentLabels[data.payment_method] ?? data.payment_method) : "Not specified"}`,
    `Deposit: ${data.no_deposit ? "Prefers no deposit / cash only" : "Standard OK"}`,
    extras.length ? `Extras:  ${extras.join(", ")}` : null,
    data.notes ? `Notes:   ${data.notes}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: OWNER_EMAIL,
    subject: `Quote request — ${data.company_name} · ${vehicleLabels[data.vehicle_type] ?? data.vehicle_type} · ${days}d`,
    text: lines,
  });
  if (result.error) {
    console.error("[email] Resend error for inquiry notification:", result.error);
  } else {
    console.log("[email] inquiry notification sent, id:", result.data?.id);
  }
}

/**
 * Sends a quote response from the rental operator to the customer.
 * Called when an operator submits their price and message via /app/quotes/[companyId].
 */
export async function sendQuoteResponseToCustomer(data: {
  customer_name: string;
  customer_email: string;
  company_name: string;
  company_slug: string;
  company_phone?: string | null;
  company_email?: string | null;
  pickup_datetime: string;
  return_datetime: string;
  vehicle_type: string;
  quoted_price?: number | null;
  operator_response: string;
  response_token?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const vehicleLabels: Record<string, string> = {
    compact: "Compact", mid_size: "Mid-size", big: "Full-size / Big",
    suv: "SUV", minivan: "Minivan (7 seats)", bus: "Bus (9 seats)", any: "Any / Best price",
  };

  const pickup = new Date(data.pickup_datetime);
  const ret = new Date(data.return_datetime);
  const days = Math.round((ret.getTime() - pickup.getTime()) / 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const respondUrl = data.response_token
    ? `https://carrentdesk.com/q/${data.response_token}`
    : null;

  const lines = [
    `Hi ${data.customer_name},`,
    ``,
    `Good news — ${data.company_name} has responded to your quote request!`,
    ``,
    `── Your trip ──`,
    `Pickup:  ${fmt(pickup)}`,
    `Return:  ${fmt(ret)}  (${days} day${days !== 1 ? "s" : ""})`,
    `Car type: ${vehicleLabels[data.vehicle_type] ?? data.vehicle_type}`,
    ``,
    `── Their quote ──`,
    data.quoted_price ? `Price:   €${Number(data.quoted_price).toFixed(2)} total` : null,
    ``,
    data.operator_response,
    ``,
    `── Contact ${data.company_name} ──`,
    data.company_phone ? `Phone: ${data.company_phone}` : null,
    data.company_email ? `Email: ${data.company_email}` : null,
    `Listing: https://carrentdesk.com/c/${data.company_slug}`,
    ``,
    respondUrl
      ? `👉 Accept or decline this offer:\n${respondUrl}`
      : null,
    ``,
    `Reply to this email if you have any questions.`,
    ``,
    `— CarRentDesk`,
  ].filter((l) => l !== null).join("\n");

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.customer_email,
    replyTo: data.company_email ?? OWNER_EMAIL,
    subject: `Quote from ${data.company_name}${data.quoted_price ? ` — €${Number(data.quoted_price).toFixed(2)}` : ""} · ${days}d · ${vehicleLabels[data.vehicle_type] ?? data.vehicle_type}`,
    text: lines,
  });
  if (result.error) {
    console.error("[email] Resend error for quote response:", result.error);
  } else {
    console.log("[email] quote response sent to customer, id:", result.data?.id);
  }
}

/**
 * Tells the rental (and CCs admin) that a customer accepted their quote.
 * Reply-To is the customer so the rental can continue the booking by email.
 * If the rental has no email, admin still gets the notification.
 */
export async function sendQuoteAcceptedNotification(data: {
  company_name: string;
  company_id: string;
  company_slug: string;
  company_phone?: string | null;
  company_email?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  pickup_datetime: string;
  return_datetime: string;
  vehicle_type: string;
  pickup_location: string;
  quoted_price?: number | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const vehicleLabels: Record<string, string> = {
    compact: "Compact", mid_size: "Mid-size", big: "Full-size / Big",
    suv: "SUV", minivan: "Minivan (7 seats)", bus: "Bus (9 seats)", any: "Any / Best price",
  };

  const pickup = new Date(data.pickup_datetime);
  const ret = new Date(data.return_datetime);
  const days = Math.round((ret.getTime() - pickup.getTime()) / 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const toRental = Boolean(data.company_email);
  const body = [
    toRental
      ? `Good news — ${data.customer_name} has accepted your quote via CarRentDesk.`
      : `A customer has accepted a quote.`,
    ``,
    `── Trip ──`,
    `Pickup:   ${fmt(pickup)}`,
    `Return:   ${fmt(ret)}  (${days} day${days !== 1 ? "s" : ""})`,
    `Location: ${data.pickup_location}`,
    `Car:      ${vehicleLabels[data.vehicle_type] ?? data.vehicle_type}`,
    data.quoted_price ? `Price:    €${Number(data.quoted_price).toFixed(2)}` : null,
    ``,
    `── Customer ──`,
    `Name:  ${data.customer_name}`,
    `Phone: ${data.customer_phone}`,
    data.customer_email ? `Email: ${data.customer_email}` : null,
    ``,
    toRental && data.customer_email
      ? `Reply to this email to reach ${data.customer_name} directly.`
      : null,
    ``,
    `Listing: https://carrentdesk.com/c/${data.company_slug}`,
    ``,
    `— CarRentDesk`,
  ].filter((l) => l !== null).join("\n");

  const subject = toRental
    ? `Booking confirmed — ${data.customer_name} accepted your quote${data.quoted_price ? ` (€${Number(data.quoted_price).toFixed(2)})` : ""}`
    : `Booking accepted — ${data.customer_name} → ${data.company_name}`;

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.company_email ?? OWNER_EMAIL,
    ...(toRental ? { cc: OWNER_EMAIL } : {}),
    ...(data.customer_email ? { replyTo: data.customer_email } : {}),
    subject,
    text: body,
  });

  if (result.error) {
    console.error("[email] Resend error for quote accepted:", result.error);
  } else {
    console.log("[email] quote accepted sent to", data.company_email ?? OWNER_EMAIL, "id:", result.data?.id);
  }
}

/**
 * Sends a full quote/inquiry directly to the rental company's email.
 * From: CarRentDesk  |  Reply-To: customer's email
 * The rental can reply directly to reach the customer while CarRentDesk stays visible.
 */
export async function sendInquiryToRental(data: {
  rental_email: string;
  rental_name: string;
  claim_url?: string | null;
  company_name: string;
  company_slug: string | null;
  city_slug: string | null;
  pickup_datetime: string;
  return_datetime: string;
  pickup_location: string;
  return_location?: string | null;
  vehicle_type: string;
  automatic_transmission?: boolean;
  cross_border: boolean;
  cross_border_countries: string[];
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  driver_age: number;
  payment_method?: string | null;
  no_deposit: boolean;
  child_seats: number;
  additional_driver: boolean;
  notes?: string | null;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const vehicleLabels: Record<string, string> = {
    compact: "Compact", mid_size: "Mid-size", big: "Full-size / Big",
    suv: "SUV", minivan: "Minivan (7 seats)", bus: "Bus (9 seats)", any: "Any / Best price",
  };
  const paymentLabels: Record<string, string> = {
    cash: "Cash", debit: "Debit card", paypal: "PayPal",
    bank_transfer: "Bank transfer", other: "Other",
  };

  const pickup = new Date(data.pickup_datetime);
  const ret = new Date(data.return_datetime);
  const days = Math.round((ret.getTime() - pickup.getTime()) / 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const extras: string[] = [];
  if (data.child_seats > 0) extras.push(`Child seat ×${data.child_seats}`);
  if (data.automatic_transmission) extras.push("Automatic transmission");
  if (data.additional_driver) extras.push("Additional driver");
  if (data.cross_border && data.cross_border_countries.length)
    extras.push(`Cross-border: ${data.cross_border_countries.join(", ")}`);

  const lines = [
    `Hi ${data.rental_name},`,
    ``,
    `You have a new quote request via CarRentDesk!`,
    ``,
    `── Trip ──`,
    `Pickup:  ${fmt(pickup)}`,
    `Return:  ${fmt(ret)}  (${days} day${days !== 1 ? "s" : ""})`,
    `Pickup location: ${data.pickup_location}`,
    data.return_location ? `Return location: ${data.return_location}` : null,
    `Car type: ${vehicleLabels[data.vehicle_type] ?? data.vehicle_type}`,
    ``,
    `── Driver ──`,
    `Name:    ${data.customer_name}`,
    `Phone:   ${data.customer_phone}`,
    data.customer_email ? `Email:   ${data.customer_email}` : null,
    `Age:     ${data.driver_age}`,
    ``,
    `── Preferences ──`,
    `Payment: ${data.payment_method ? (paymentLabels[data.payment_method] ?? data.payment_method) : "Not specified"}`,
    `Deposit: ${data.no_deposit ? "Prefers no deposit / cash only" : "Standard OK"}`,
    extras.length ? `Extras:  ${extras.join(", ")}` : null,
    data.notes ? `Notes:   ${data.notes}` : null,
    ``,
    `── How to reply ──`,
    data.customer_email
      ? `Reply directly to this email — your response will go straight to ${data.customer_name}.`
      : `Call or message the customer directly: ${data.customer_phone}`,
    data.claim_url
      ? `\nOr respond with a price quote via CarRentDesk:\n${data.claim_url}`
      : null,
    ``,
    `Your listing: https://carrentdesk.com/c/${data.company_slug ?? ""}`,
    ``,
    `— CarRentDesk`,
  ].filter((l) => l !== null).join("\n");

  const subject = `New quote request via CarRentDesk — ${data.customer_name} — ${
    data.city_slug ? data.city_slug.replace(/-/g, " ") : ""
  } ${fmt(pickup).slice(0, 7)}–${fmt(ret).slice(0, 7)}`;

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.rental_email,
    replyTo: data.customer_email ?? OWNER_EMAIL,
    cc: OWNER_EMAIL,
    subject,
    text: lines,
  });

  if (result.error) {
    console.error("[email] Resend error sending inquiry to rental:", result.error);
    return false;
  }
  console.log("[email] inquiry sent to rental, id:", result.data?.id);
  return true;
}

/**
 * Confirms to the operator that a claim request was submitted (awaiting review).
 */
export async function sendJoinClaimPendingEmail(data: {
  email: string;
  contactName: string;
  companyName: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: data.email,
    subject: `We received your claim request — ${data.companyName}`,
    text: [
      `Hi ${data.contactName},`,
      ``,
      `Thanks for requesting to manage ${data.companyName} on CarRentDesk.`,
      ``,
      `We review every claim to make sure listings go to the right operator. You'll receive a sign-in link by email once approved — usually within 1 business day.`,
      ``,
      `If you have questions, reply to this email.`,
      ``,
      `— CarRentDesk`,
    ].join("\n"),
  });
}
