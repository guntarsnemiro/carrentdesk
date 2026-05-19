import type { Metadata } from "next";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/operator/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Operator Portal · CarRentDesk",
    template: "%s · CarRentDesk Ops",
  },
  robots: { index: false, follow: false },
};

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  // No user — render without sidebar so /app/login displays correctly
  if (!user) {
    return <>{children}</>;
  }

  const db = createServiceRoleClient();
  const { data: memberships } = await db
    .from("company_members")
    .select("role, company:companies(id, name, slug, status)")
    .eq("user_id", user.id);

  const companies = (memberships ?? []).map((m) => ({
    ...(m.company as { id: string; name: string; slug: string; status: string }),
    role: m.role,
  }));

  const activeCompanyId = companies[0]?.id ?? null;

  return (
    <AppShell
      user={{ email: user.email ?? "" }}
      companies={companies}
      activeCompanyId={activeCompanyId}
    >
      {children}
    </AppShell>
  );
}
