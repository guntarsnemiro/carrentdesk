import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

const cityLabel: Record<string, string> = {
  riga: "Riga",
  tallinn: "Tallinn",
  vilnius: "Vilnius",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const { claimed } = await searchParams;

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/app/login");

  const db = createServiceRoleClient();
  const { data: memberships } = await db
    .from("company_members")
    .select("role, company:companies(id, name, slug, status, city)")
    .eq("user_id", user.id);

  const companies = (memberships ?? []).map((m) => ({
    ...(m.company as { id: string; name: string; slug: string; status: string; city: string }),
    role: m.role,
  }));

  return (
    <div className="px-8 py-8">
      {/* Welcome banner on first claim */}
      {claimed === "1" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-emerald-800">Welcome to CarRentDesk!</p>
            <p className="text-sm text-emerald-700">Your account is set up. Use the navigation on the left to manage your operations.</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Today&apos;s operations at a glance.</p>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
          <p className="text-sm font-medium text-neutral-600">No companies linked to your account yet.</p>
          <p className="mt-1 text-sm text-neutral-400">
            Contact us at{" "}
            <a href="mailto:info@carrentdesk.com" className="text-brand-700 underline-offset-2 hover:underline">
              info@carrentdesk.com
            </a>{" "}
            to get set up.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {companies.map((company) => (
            <div key={company.id} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-neutral-900">{company.name}</h2>
                    {company.status === "verified" ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
                    ) : company.status === "claimed" ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Claimed</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-400">{cityLabel[company.city] ?? company.city}</p>
                </div>
                <a
                  href={`/c/${company.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline"
                >
                  View public listing →
                </a>
              </div>

              {/* Quick stats row — will fill in as modules are built */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Vehicles" value="—" href={`/app/fleet/${company.id}`} />
                <Stat label="Active bookings" value="—" soon />
                <Stat label="Inspections this week" value="—" soon />
                <Stat label="Revenue this month" value="—" soon />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, href, soon }: { label: string; value: string; href?: string; soon?: boolean }) {
  const inner = (
    <div className={`rounded-xl border border-border px-4 py-3 ${href ? "hover:bg-slate-50" : ""}`}>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${soon ? "text-neutral-300" : "text-neutral-900"}`}>{value}</p>
      {soon && <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-300">Coming soon</p>}
    </div>
  );
  if (href) return <a href={href}>{inner}</a>;
  return <div>{inner}</div>;
}
