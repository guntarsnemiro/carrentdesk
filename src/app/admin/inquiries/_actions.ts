"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendQuoteResponseToCustomer, sendInquiryToRental, sendQuoteAcceptedNotification } from "@/lib/email";

export type InquiryStatus = "new" | "forwarded" | "quoted" | "booked" | "declined" | "lost";

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  const db = createServiceRoleClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from("inquiries")
    .update(status === "forwarded" ? { status, forwarded_at: now } : { status })
    .eq("id", id);
  if (error) throw error;
}

export async function updateInquiryNotes(id: string, admin_notes: string) {
  const db = createServiceRoleClient();
  const { error } = await db.from("inquiries").update({ admin_notes }).eq("id", id);
  if (error) throw error;
}

export type SendQuoteResult = { ok: true } | { ok: false; error: string };

export async function adminSendQuoteToCustomer(
  inquiryId: string,
  data: { operator_response: string; quoted_price?: number | null }
): Promise<SendQuoteResult> {
  if (!data.operator_response?.trim()) return { ok: false, error: "Message is required" };

  const db = createServiceRoleClient();

  const { data: inq } = await db
    .from("inquiries")
    .select("customer_name, customer_email, company_id, company_name, company_slug, pickup_datetime, return_datetime, vehicle_type, response_token")
    .eq("id", inquiryId)
    .maybeSingle();
  if (!inq) return { ok: false, error: "Inquiry not found" };
  if (!inq.customer_email) return { ok: false, error: "Customer has no email on file" };

  // Fetch rental contact details if company is on the platform
  let companyPhone: string | null = null;
  let companyEmail: string | null = null;
  if (inq.company_id) {
    const { data: co } = await db
      .from("companies")
      .select("phone, email, whatsapp")
      .eq("id", inq.company_id)
      .maybeSingle();
    companyPhone = co?.whatsapp ?? co?.phone ?? null;
    companyEmail = co?.email ?? null;
  }

  const { error } = await db
    .from("inquiries")
    .update({
      operator_response: data.operator_response.trim(),
      quoted_price: data.quoted_price ?? null,
      operator_response_at: new Date().toISOString(),
      status: "quoted",
    })
    .eq("id", inquiryId);

  if (error) {
    console.error("[admin quote] DB error:", error);
    return { ok: false, error: "Failed to save. Please try again." };
  }

  await sendQuoteResponseToCustomer({
    customer_name: inq.customer_name,
    customer_email: inq.customer_email,
    company_name: inq.company_name ?? "the rental",
    company_slug: inq.company_slug ?? "",
    company_phone: companyPhone,
    company_email: companyEmail,
    pickup_datetime: inq.pickup_datetime,
    return_datetime: inq.return_datetime,
    vehicle_type: inq.vehicle_type,
    quoted_price: data.quoted_price,
    operator_response: data.operator_response.trim(),
    response_token: inq.response_token,
  });

  return { ok: true };
}

export type GenerateInviteLinkResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function generateRentalInviteLink(
  companyId: string,
  email?: string
): Promise<GenerateInviteLinkResult> {
  if (!companyId) return { ok: false, error: "No company linked to this inquiry" };

  const db = createServiceRoleClient();
  const { randomBytes } = await import("crypto");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await db.from("claim_tokens").insert({
    company_id: companyId,
    token,
    sent_to_email: email ?? null,
    sent_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  if (error) {
    console.error("[invite] DB error:", error);
    return { ok: false, error: "Failed to generate link" };
  }

  // Save email to company if provided
  if (email) {
    await db.from("companies").update({ email }).eq("id", companyId);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com";
  const url = `${base}/claim?token=${token}`;

  // Send invite email if address given
  if (email) {
    const { data: co } = await db
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();

    const { sendClaimInvite } = await import("@/lib/email");
    await sendClaimInvite({ email, companyName: co?.name ?? "your company", claimUrl: url }).catch(
      (e) => console.error("[invite] email error:", e)
    );
  }

  return { ok: true, url };
}

export type SendInquiryEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Sends the full inquiry details to the rental company's email address.
 * Reply-To is set to the customer's email so the rental can reply directly.
 * Also generates a claim token so the rental can respond via the platform.
 */
export async function sendInquiryEmailToRental(
  inquiryId: string,
  rentalEmail?: string
): Promise<SendInquiryEmailResult> {
  const db = createServiceRoleClient();

  const { data: inq } = await db
    .from("inquiries")
    .select("*, company:companies(id, name, email, phone, whatsapp, slug)")
    .eq("id", inquiryId)
    .maybeSingle();

  if (!inq) return { ok: false, error: "Inquiry not found" };

  // Resolve rental email: use provided override, then company email
  const toEmail = rentalEmail?.trim() || (inq.company as { email?: string | null } | null)?.email;
  if (!toEmail) return { ok: false, error: "No rental email on file" };

  const companyId = inq.company_id;

  // Save email to company if it wasn't there before
  if (companyId && rentalEmail?.trim() && !(inq.company as { email?: string | null } | null)?.email) {
    await db.from("companies").update({ email: toEmail }).eq("id", companyId);
  }

  // Generate a claim token so the rental can respond via the platform
  let claimUrl: string | null = null;
  if (companyId) {
    const result = await generateRentalInviteLink(companyId);
    if (result.ok) claimUrl = result.url;
  }

  const co = inq.company as { name?: string | null } | null;

  await sendInquiryToRental({
    rental_email: toEmail,
    rental_name: co?.name ?? inq.company_name ?? "there",
    claim_url: claimUrl,
    company_name: inq.company_name ?? "",
    company_slug: inq.company_slug,
    city_slug: inq.city_slug,
    pickup_datetime: inq.pickup_datetime,
    return_datetime: inq.return_datetime,
    pickup_location: inq.pickup_location,
    return_location: inq.return_location,
    vehicle_type: inq.vehicle_type,
    automatic_transmission: inq.automatic_transmission ?? false,
    cross_border: inq.cross_border ?? false,
    cross_border_countries: inq.cross_border_countries ?? [],
    customer_name: inq.customer_name,
    customer_phone: inq.customer_phone,
    customer_email: inq.customer_email,
    driver_age: inq.driver_age,
    payment_method: inq.payment_method,
    no_deposit: inq.no_deposit ?? false,
    child_seats: inq.child_seats ?? 0,
    additional_driver: inq.additional_driver ?? false,
    notes: inq.notes,
  });

  // Mark as forwarded
  await db
    .from("inquiries")
    .update({ status: "forwarded", forwarded_at: new Date().toISOString() })
    .eq("id", inquiryId);

  return { ok: true };
}

export async function resendAcceptanceToRental(
  inquiryId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = createServiceRoleClient();

  const { data: inq } = await db
    .from("inquiries")
    .select(
      "customer_name, customer_email, customer_phone, company_id, company_name, company_slug, pickup_datetime, return_datetime, vehicle_type, pickup_location, quoted_price, status, customer_response"
    )
    .eq("id", inquiryId)
    .maybeSingle();

  if (!inq) return { ok: false, error: "Inquiry not found" };
  if (inq.status !== "booked" && inq.customer_response !== "accepted") {
    return { ok: false, error: "This inquiry is not an accepted booking" };
  }

  let companyEmail: string | null = null;
  let companyPhone: string | null = null;
  if (inq.company_id) {
    const { data: co } = await db
      .from("companies")
      .select("email, phone, whatsapp")
      .eq("id", inq.company_id)
      .maybeSingle();
    companyEmail = co?.email ?? null;
    companyPhone = co?.whatsapp ?? co?.phone ?? null;
  }
  if (!companyEmail) return { ok: false, error: "Rental has no email on file" };

  await sendQuoteAcceptedNotification({
    company_name: inq.company_name ?? "the rental",
    company_id: inq.company_id ?? "",
    company_slug: inq.company_slug ?? "",
    company_phone: companyPhone,
    company_email: companyEmail,
    customer_name: inq.customer_name,
    customer_phone: inq.customer_phone,
    customer_email: inq.customer_email,
    pickup_datetime: inq.pickup_datetime,
    return_datetime: inq.return_datetime,
    vehicle_type: inq.vehicle_type,
    pickup_location: inq.pickup_location,
    quoted_price: inq.quoted_price,
  });

  return { ok: true };
}
