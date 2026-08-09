"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendQuoteResponseToCustomer } from "@/lib/email";

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
