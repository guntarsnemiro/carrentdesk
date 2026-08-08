"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

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
