import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(db: ReturnType<typeof createServiceRoleClient>, base: string) {
  let slug = base;
  let attempt = 0;
  while (true) {
    const { data } = await db.from("companies").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

export async function POST(req: Request) {
  try {
    const { companyName, email } = await req.json();

    if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    const db = createServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://carrentdesk.com";

    // 1. Create or find the user via Supabase Admin
    // List users filtered by email (Supabase admin API doesn't have getUserByEmail)
    const { data: listData } = await db.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find((u) => u.email === email);
    let userId: string;

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: createErr } = await db.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createErr || !newUser?.user) {
        return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
      }
      userId = newUser.user.id;
    } else {
      userId = existingUser.id;
    }

    // 2. Check if user already has a company
    const { data: existingMembership } = await db
      .from("company_members")
      .select("company_id")
      .eq("user_id", userId)
      .maybeSingle();

    let companyId: string;

    if (existingMembership) {
      // Already has a company — just send them a login link
      companyId = existingMembership.company_id;
    } else {
      // 3. Create the company
      const baseSlug = slugify(companyName.trim());
      const slug     = await uniqueSlug(db, baseSlug);

      const { data: company, error: companyErr } = await db
        .from("companies")
        .insert({
          name:    companyName.trim(),
          slug,
          status:  "claimed" as const,
          city:    "riga" as const,
          country: "LV" as const,
        })
        .select("id")
        .single();

      if (companyErr || !company) {
        return NextResponse.json({ error: "Could not create company. Please try again." }, { status: 500 });
      }
      companyId = company.id;

      // 4. Link user to company
      await db.from("company_members").insert({
        user_id:    userId,
        company_id: companyId,
        role:       "owner",
      });
    }

    // 5. Generate magic link and send via email
    const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
      type:       "magiclink",
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/app/dashboard`,
      },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: "Could not send login link. Please try again." }, { status: 500 });
    }

    // Send the email via Resend (or fall back to Supabase built-in)
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM ?? "CarRentDesk <info@carrentdesk.com>";
    const magicLink = linkData.properties.action_link;

    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    fromEmail,
          to:      [email],
          subject: "Your CarRentDesk account is ready",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
              <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:8px">
                Welcome to CarRentDesk!
              </h1>
              <p style="font-size:14px;color:#64748b;margin-bottom:24px">
                Your account for <strong style="color:#0f172a">${companyName.trim()}</strong> is ready.
                Click the button below to sign in and start managing your fleet.
              </p>
              <a href="${magicLink}"
                style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;
                       font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px">
                Open my dashboard →
              </a>
              <p style="font-size:12px;color:#94a3b8;margin-top:24px">
                This link expires in 1 hour and can only be used once.
                If you didn't request this, you can safely ignore it.
              </p>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/join error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
