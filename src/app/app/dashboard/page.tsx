import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const { claimed } = await searchParams;

  const authClient = await createAuthServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

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

  const cityLabel: Record<string, string> = {
    riga: "Riga",
    tallinn: "Tallinn",
    vilnius: "Vilnius",
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top nav */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-brand-950">CarRentDesk</span>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              Operator
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-neutral-400 sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {claimed === "1" && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-emerald-800">Welcome to CarRentDesk!</p>
              <p className="text-sm text-emerald-700">Your account is set up. Start by completing your marketplace listing below.</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Operator dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your listings, fleet, and operations from one place.</p>
        </div>

        {companies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-8 py-14 text-center">
            <p className="text-sm font-medium text-neutral-600">No companies linked to your account yet.</p>
            <p className="mt-1 text-sm text-neutral-400">
              Contact us at{" "}
              <a href="mailto:hello@carrentdesk.com" className="text-brand-700 underline-offset-2 hover:underline">
                hello@carrentdesk.com
              </a>{" "}
              to get set up.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {companies.map((company) => (
              <div key={company.id} className="rounded-2xl border border-border bg-white shadow-sm">
                {/* Company header */}
                <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-neutral-900">{company.name}</h2>
                      {company.status === "verified" ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Verified</span>
                      ) : company.status === "claimed" ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Claimed</span>
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">Unverified</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      {cityLabel[company.city] ?? company.city} · {company.role}
                    </p>
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

                {/* Module grid */}
                <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                  <Module
                    href={`/app/profile/${company.id}`}
                    icon={<ListingIcon />}
                    label="Marketplace listing"
                    description="Edit your public profile, contact details, and description"
                  />
                  <Module
                    href={`/app/fleet/${company.id}`}
                    icon={<FleetIcon />}
                    label="Fleet"
                    description="Add and manage your vehicles"
                    comingSoon
                  />
                  <Module
                    href={`/app/inspections/${company.id}`}
                    icon={<InspectionIcon />}
                    label="Inspections"
                    description="Pre- and post-rental condition reports"
                    comingSoon
                  />
                  <Module
                    href={`/app/bookings/${company.id}`}
                    icon={<BookingIcon />}
                    label="Bookings"
                    description="Log and track rental bookings"
                    comingSoon
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Module({
  href,
  icon,
  label,
  description,
  comingSoon = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  comingSoon?: boolean;
}) {
  const inner = (
    <div className={`flex h-full flex-col gap-2 bg-white p-5 transition-colors ${comingSoon ? "opacity-50" : "hover:bg-slate-50"}`}>
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {icon}
        </div>
        {comingSoon && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Soon
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{description}</p>
      </div>
    </div>
  );

  if (comingSoon) return <div>{inner}</div>;
  return <a href={href}>{inner}</a>;
}

function ListingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}
function FleetIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}
function InspectionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  );
}
function BookingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
