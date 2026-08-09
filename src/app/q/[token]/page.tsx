import { createServiceRoleClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuoteResponseClient } from "./_components/quote-response-client";

export const dynamic = "force-dynamic";

export default async function QuoteResponsePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = createServiceRoleClient();

  const { data: inq } = await db
    .from("inquiries")
    .select("customer_name, company_name, pickup_datetime, return_datetime, pickup_location, vehicle_type, quoted_price, operator_response, customer_response")
    .eq("response_token", token)
    .maybeSingle();

  if (!inq || !inq.operator_response) notFound();

  return (
    <QuoteResponseClient
      token={token}
      companyName={inq.company_name ?? "the rental"}
      customerName={inq.customer_name}
      pickupDatetime={inq.pickup_datetime}
      returnDatetime={inq.return_datetime}
      pickupLocation={inq.pickup_location}
      vehicleType={inq.vehicle_type}
      quotedPrice={inq.quoted_price ?? null}
      operatorResponse={inq.operator_response}
      alreadyResponded={(inq.customer_response as "accepted" | "declined" | null) ?? null}
    />
  );
}
