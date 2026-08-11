"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendInquiryNotification, sendInquiryToRental } from "@/lib/email";

export type InquiryFormData = {
  company_id: string;
  company_slug: string;
  company_name: string;
  city_slug: string;
  pickup_datetime: string;
  return_datetime: string;
  pickup_location: string;
  return_location: string;
  vehicle_type: string;
  automatic_transmission: boolean;
  cross_border: boolean;
  cross_border_countries: string[];
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  driver_age: number;
  payment_method: string;
  no_deposit: boolean;
  child_seats: number;
  additional_driver: boolean;
  notes: string;
};

export type SubmitInquiryResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitInquiry(
  data: InquiryFormData
): Promise<SubmitInquiryResult> {
  // Basic server-side validation
  if (!data.customer_name?.trim()) return { ok: false, error: "Name is required" };
  if (!data.customer_phone?.trim()) return { ok: false, error: "Phone is required" };
  if (!data.customer_email?.trim()) return { ok: false, error: "Email is required" };
  if (!data.pickup_datetime) return { ok: false, error: "Pickup date is required" };
  if (!data.return_datetime) return { ok: false, error: "Return date is required" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(data.pickup_datetime) < today) {
    return { ok: false, error: "Pickup date cannot be in the past" };
  }
  if (new Date(data.return_datetime) <= new Date(data.pickup_datetime)) {
    return { ok: false, error: "Return must be after pickup" };
  }
  if (!data.driver_age || data.driver_age < 18 || data.driver_age > 99) {
    return { ok: false, error: "Driver age must be between 18 and 99" };
  }

  const db = createServiceRoleClient();
  const { error } = await db.from("inquiries").insert({
    company_id: data.company_id || null,
    company_slug: data.company_slug,
    company_name: data.company_name,
    city_slug: data.city_slug,
    source: "company_page",
    pickup_datetime: data.pickup_datetime,
    return_datetime: data.return_datetime,
    pickup_location: data.pickup_location,
    return_location: data.return_location || null,
    vehicle_type: data.vehicle_type,
    automatic_transmission: data.automatic_transmission,
    cross_border: data.cross_border,
    cross_border_countries: data.cross_border_countries,
    customer_name: data.customer_name.trim(),
    customer_phone: data.customer_phone.trim(),
    customer_email: data.customer_email?.trim() || null,
    driver_age: data.driver_age,
    payment_method: data.payment_method || null,
    no_deposit: data.no_deposit,
    child_seats: data.child_seats,
    additional_driver: data.additional_driver,
    notes: data.notes?.trim() || null,
    status: "new",
  });

  if (error) {
    console.error("[inquiry] DB error:", error);
    return { ok: false, error: "Failed to save. Please try again." };
  }

  // Fire-and-forget — don't block the response on email
  sendInquiryNotification(data).catch((e) =>
    console.error("[inquiry] email error:", e)
  );

  // If the rental has an email, send them the inquiry automatically
  if (data.company_id) {
    void (async () => {
      try {
        const { data: co } = await db
          .from("companies")
          .select("email, name")
          .eq("id", data.company_id)
          .maybeSingle();
        if (co?.email) {
          await sendInquiryToRental({
            rental_email: co.email,
            rental_name: co.name ?? data.company_name,
            claim_url: null,
            company_name: data.company_name,
            company_slug: data.company_slug,
            city_slug: data.city_slug,
            pickup_datetime: data.pickup_datetime,
            return_datetime: data.return_datetime,
            pickup_location: data.pickup_location,
            return_location: data.return_location || null,
            vehicle_type: data.vehicle_type,
            automatic_transmission: data.automatic_transmission,
            cross_border: data.cross_border,
            cross_border_countries: data.cross_border_countries,
            customer_name: data.customer_name.trim(),
            customer_phone: data.customer_phone.trim(),
            customer_email: data.customer_email?.trim() || null,
            driver_age: data.driver_age,
            payment_method: data.payment_method || null,
            no_deposit: data.no_deposit,
            child_seats: data.child_seats,
            additional_driver: data.additional_driver,
            notes: data.notes?.trim() || null,
          });
        }
      } catch (e) {
        console.error("[inquiry] rental email error:", e);
      }
    })();
  }

  return { ok: true };
}
