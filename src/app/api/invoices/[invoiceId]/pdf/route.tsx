import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdf } from "@/components/invoice-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const db = createServiceRoleClient();

  const { data: invoice } = await db
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) return new NextResponse("Not found", { status: 404 });

  // Verify access
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", invoice.company_id)
    .maybeSingle();
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  const { data: items } = await db
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order");

  const buffer = await renderToBuffer(
    <InvoicePdf invoice={invoice} items={items ?? []} />
  );

  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
