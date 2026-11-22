"use server";

import { redirect } from "next/navigation";
import { cancelOnlineBooking } from "@/lib/booking/cancel-online";
import { createServiceRoleClient } from "@/lib/supabase/server";

const TOKEN = /^[A-Za-z0-9_-]{20,80}$/;

export async function cancelByCustomerToken(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!TOKEN.test(token)) redirect("/book/cancel/invalid");

  const db = createServiceRoleClient();
  const { data: booking } = await db
    .from("bookings")
    .select("id, status, source")
    .eq("customer_cancel_token", token)
    .maybeSingle();
  if (!booking || booking.source !== "online") redirect(`/book/cancel/${token}`);
  if (booking.status !== "confirmed" && booking.status !== "pending_payment") {
    redirect(`/book/cancel/${token}`);
  }

  await cancelOnlineBooking(booking.id, "customer");
  redirect(`/book/cancel/${token}`);
}
