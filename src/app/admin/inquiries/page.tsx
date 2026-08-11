import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InquiriesClient } from "./_components/inquiries-client";

export const metadata: Metadata = { title: "Inquiries" };
export const revalidate = 0;

export default async function InquiriesPage() {
  const db = createServiceRoleClient();

  const { data: inquiries } = await db
    .from("inquiries")
    .select("*, company:companies(whatsapp, phone, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  const counts = {
    new: 0, forwarded: 0, quoted: 0, booked: 0, declined: 0, lost: 0,
  };
  for (const inq of inquiries ?? []) {
    const s = inq.status as keyof typeof counts;
    if (s in counts) counts[s]++;
  }

  return (
    <InquiriesClient
      inquiries={inquiries ?? []}
      counts={counts}
    />
  );
}
