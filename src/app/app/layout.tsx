import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/operator/sidebar";

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

  if (!user) redirect("/app/login");

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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        user={{ email: user.email ?? "" }}
        companies={companies}
        activeCompanyId={activeCompanyId}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
