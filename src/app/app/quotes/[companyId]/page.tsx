import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { QuotesClient } from "./_components/quotes-client";

export const metadata: Metadata = { title: "Quote requests" };
export const revalidate = 0;

export default async function QuotesPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();

  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!membership) notFound();

  const { data: inquiries } = await db
    .from("inquiries")
    .select(
      "id, created_at, pickup_datetime, return_datetime, pickup_location, return_location, vehicle_type, automatic_transmission, customer_name, customer_phone, customer_email, driver_age, payment_method, no_deposit, child_seats, additional_driver, cross_border, cross_border_countries, notes, status, operator_response, quoted_price, operator_response_at"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = inquiries ?? [];
  const newCount = rows.filter((i) => i.status === "new" || i.status === "forwarded").length;

  return (
    <QuotesClient
      inquiries={rows}
      companyId={companyId}
      newCount={newCount}
    />
  );
}
