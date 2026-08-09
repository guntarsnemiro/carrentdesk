"use server";

import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendQuoteResponseToCustomer } from "@/lib/email";

export type SubmitQuoteResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitQuoteResponse(
  inquiryId: string,
  companyId: string,
  data: {
    operator_response: string;
    quoted_price?: number | null;
  }
): Promise<SubmitQuoteResult> {
  if (!data.operator_response?.trim()) {
    return { ok: false, error: "Message is required" };
  }

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();

  // Verify the user belongs to this company
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!membership) return { ok: false, error: "Not authorised" };

  // Fetch the inquiry (must belong to this company)
  const { data: inq } = await db
    .from("inquiries")
    .select("id, company_id, customer_name, customer_email, pickup_datetime, return_datetime, vehicle_type, status")
    .eq("id", inquiryId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!inq) return { ok: false, error: "Inquiry not found" };

  // Fetch company contact details for the email
  const { data: company } = await db
    .from("companies")
    .select("name, slug, phone, email, whatsapp")
    .eq("id", companyId)
    .maybeSingle();

  // Update the inquiry
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
    console.error("[quotes] DB error:", error);
    return { ok: false, error: "Failed to save. Please try again." };
  }

  // Email the customer if we have their address
  if (inq.customer_email && company) {
    sendQuoteResponseToCustomer({
      customer_name: inq.customer_name,
      customer_email: inq.customer_email,
      company_name: company.name,
      company_slug: company.slug,
      company_phone: company.whatsapp ?? company.phone,
      company_email: company.email,
      pickup_datetime: inq.pickup_datetime,
      return_datetime: inq.return_datetime,
      vehicle_type: inq.vehicle_type,
      quoted_price: data.quoted_price,
      operator_response: data.operator_response.trim(),
    }).catch((e) => console.error("[quotes] email error:", e));
  }

  return { ok: true };
}
