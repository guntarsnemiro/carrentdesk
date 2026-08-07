import type { createServiceRoleClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServiceRoleClient>;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function uniqueSlug(db: Db, base: string) {
  let slug = base;
  let attempt = 0;
  while (true) {
    const { data } = await db.from("companies").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

export async function findOrCreateUserId(db: Db, email: string) {
  const { data: listData } = await db.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = listData?.users?.find((u) => u.email === email);
  if (existingUser) return existingUser.id;

  const { data: newUser, error: createErr } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createErr || !newUser?.user) {
    throw new Error("Could not create account.");
  }
  return newUser.user.id;
}

export async function sendMagicLinkEmail(
  db: Db,
  email: string,
  companyName: string,
  siteUrl: string
) {
  const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/app/dashboard`,
    },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    throw new Error("Could not send login link.");
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM ?? "CarRentDesk <info@carrentdesk.com>";
  const magicLink = linkData.properties.action_link;

  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Your CarRentDesk account is ready",
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
              <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:8px">
                Welcome to CarRentDesk!
              </h1>
              <p style="font-size:14px;color:#64748b;margin-bottom:24px">
                Your account for <strong style="color:#0f172a">${companyName}</strong> is ready.
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
}
