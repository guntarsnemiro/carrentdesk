import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./_components/profile-edit-form";

export const metadata: Metadata = { title: "Edit profile" };

interface Props {
  params: Promise<{ companyId: string }>;
}

export default async function ProfileEditPage({ params }: Props) {
  const { companyId } = await params;

  // Auth guard
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();

  // Verify this user is a member of the requested company
  const { data: membership } = await db
    .from("company_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!membership) notFound();

  // Load company + primary location
  const { data: company } = await db
    .from("companies")
    .select("id, name, slug, city, country, status, description, phone, whatsapp, website, email, founded_year")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) notFound();

  const { data: location } = await db
    .from("locations")
    .select("id, address, lat, lng")
    .eq("company_id", companyId)
    .eq("is_primary", true)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top nav */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <a
            href="/app/dashboard"
            className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline"
          >
            ← Dashboard
          </a>
          <span className="text-neutral-300">/</span>
          <span className="text-sm font-medium text-neutral-700">Edit profile</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">{company.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Changes are saved immediately and appear on your public profile.
          </p>
        </div>

        <ProfileEditForm
          company={company}
          location={location ?? null}
        />
      </main>
    </div>
  );
}
