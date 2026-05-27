import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { AdminSidebar } from "./_components/admin-sidebar";

export const metadata: Metadata = {
  title: { default: "Admin · CarRentDesk", template: "%s · CRD Admin" },
  robots: { index: false, follow: false },
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "info@carrentdesk.com,guntarsnemiro@inbox.lv").split(",").map((e) => e.trim().toLowerCase());

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    redirect("/app/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar userEmail={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
