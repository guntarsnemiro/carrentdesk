import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(
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

  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", invoice.company_id)
    .maybeSingle();
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  if (!invoice.buyer_email) {
    return NextResponse.json({ error: "No buyer email on invoice" }, { status: 400 });
  }

  // Fetch PDF
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const pdfRes = await fetch(`${baseUrl}/api/invoices/${invoiceId}/pdf`, {
    headers: { cookie: _req.headers.get("cookie") ?? "" },
  });
  if (!pdfRes.ok) {
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
  const pdfBuffer = await pdfRes.arrayBuffer();

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const fromAddress = process.env.EMAIL_FROM ?? "CarRentDesk <info@carrentdesk.com>";

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: [invoice.buyer_email],
    subject: `Invoice ${invoice.invoice_number} from ${invoice.seller_name}`,
    html: `
      <p>Dear ${invoice.buyer_name},</p>
      <p>Please find your invoice <strong>${invoice.invoice_number}</strong> attached.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="color:#6b7280;padding-right:16px">Amount due:</td><td><strong>€${Number(invoice.total).toFixed(2)}</strong></td></tr>
        <tr><td style="color:#6b7280;padding-right:16px">Payment terms:</td><td>${invoice.payment_terms ?? "Due on receipt"}</td></tr>
        ${invoice.seller_iban ? `<tr><td style="color:#6b7280;padding-right:16px">IBAN:</td><td style="font-family:monospace">${invoice.seller_iban}</td></tr>` : ""}
      </table>
      ${invoice.notes ? `<p style="color:#6b7280;font-size:14px">${invoice.notes}</p>` : ""}
      <p>Best regards,<br>${invoice.seller_name}</p>
    `,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update status to sent
  await db.from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", invoiceId);

  return NextResponse.json({ ok: true });
}
