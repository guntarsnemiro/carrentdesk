"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendQuoteAcceptedNotification } from "@/lib/email";

export type QuoteResponseResult =
  | { ok: true; action: "accepted" | "declined"; companyName: string; customerName: string }
  | { ok: false; error: string };

export async function respondToQuote(
  token: string,
  action: "accepted" | "declined"
): Promise<QuoteResponseResult> {
  const db = createServiceRoleClient();

  const { data: inq } = await db
    .from("inquiries")
    .select(
      "id, customer_name, customer_response, company_name, company_id, company_slug, " +
      "pickup_datetime, return_datetime, vehicle_type, pickup_location, " +
      "customer_phone, customer_email, payment_method, quoted_price, operator_response"
    )
    .eq("response_token", token)
    .maybeSingle();

  if (!inq) return { ok: false, error: "This link is invalid or has expired." };
  if (inq.customer_response) {
    return {
      ok: true,
      action: inq.customer_response as "accepted" | "declined",
      companyName: inq.company_name ?? "the rental",
      customerName: inq.customer_name,
    };
  }

  const { error } = await db
    .from("inquiries")
    .update({
      customer_response: action,
      customer_response_at: new Date().toISOString(),
      status: action === "accepted" ? "booked" : "declined",
    })
    .eq("id", inq.id);

  if (error) return { ok: false, error: "Something went wrong. Please try again." };

  if (action === "accepted") {
    // Get rental contact details
    let companyPhone: string | null = null;
    let companyEmail: string | null = null;
    if (inq.company_id) {
      const { data: co } = await db
        .from("companies")
        .select("phone, whatsapp, email")
        .eq("id", inq.company_id)
        .maybeSingle();
      companyPhone = co?.whatsapp ?? co?.phone ?? null;
      companyEmail = co?.email ?? null;
    }

    await sendQuoteAcceptedNotification({
      company_name: inq.company_name ?? "unknown",
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
  }

  return {
    ok: true,
    action,
    companyName: inq.company_name ?? "the rental",
    customerName: inq.customer_name,
  };
}
