import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/app/login");

  // Fetch operator's company memberships
  const db = createServiceRoleClient();
  const { data: memberships } = await db
    .from("company_members")
    .select("role, company:companies(id, name, slug, status)")
    .eq("user_id", user.id);

  const companies = (memberships ?? []).map((m) => ({
    ...(m.company as { id: string; name: string; slug: string; status: string }),
    role: m.role,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top nav */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-base font-semibold text-brand-950">
            CarRentDesk <span className="font-normal text-neutral-400">/ Operator</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Welcome back. Manage your company profiles below.
        </p>

        {companies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
            <p className="text-sm font-medium text-neutral-600">
              No companies linked to your account yet.
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              Contact us at{" "}
              <a
                href="mailto:hello@carrentdesk.com"
                className="text-brand-700 underline-offset-2 hover:underline"
              >
                hello@carrentdesk.com
              </a>{" "}
              to get your company connected.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {companies.map((company) => (
              <div
                key={company.id}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-neutral-900">
                    {company!.name}
                  </h2>
                  {company.status === "verified" ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Verified
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {company.status === "claimed" ? "Claimed" : "Unverified"}
                    </span>
                  )}
                </div>
                <p className="mb-4 text-sm text-neutral-500 capitalize">
                  Role: {company.role}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/c/${company.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-slate-50"
                  >
                    View public profile →
                  </a>
                  {/* More actions will appear here: Edit profile, Fleet, Inspections */}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
