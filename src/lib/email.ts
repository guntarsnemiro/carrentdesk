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
  if (!RESEND_API_KEY) return null;
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

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: OWNER_EMAIL,
    replyTo: data.email,
    subject: `New access request — ${data.companyName ?? data.name} (${data.city ?? "?"})`,
    text: `New access request on CarRentDesk:\n\n${lines}\n\nReply directly to respond to ${data.name}.`,
  });
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
