import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { ClaimConfirmButton } from "./_components/claim-confirm-button";

export const metadata: Metadata = { title: "Claim your listing · CarRentDesk" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ClaimPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <ClaimError message="No claim token provided. Please use the link from your invitation email." />;
  }

  const db = createServiceRoleClient();

  // Look up the token
  const { data: ct } = await db
    .from("claim_tokens")
    .select("id, company_id, expires_at, used_at, sent_to_email")
    .eq("token", token)
    .maybeSingle();

  if (!ct) {
    return <ClaimError message="This claim link is invalid. Please contact us at hello@carrentdesk.com." />;
  }
  if (ct.used_at) {
    return <ClaimError message="This claim link has already been used. Sign in at /app/login to access your dashboard." />;
  }
  if (new Date(ct.expires_at) < new Date()) {
    return <ClaimError message="This claim link has expired. Please contact us for a new one." />;
  }

  // Load the company
  const { data: company } = await db
    .from("companies")
    .select("id, name, slug, city, country, status")
    .eq("id", ct.company_id)
    .maybeSingle();

  if (!company) {
    return <ClaimError message="Company not found. Please contact us at hello@carrentdesk.com." />;
  }

  // Check if the current user is already logged in
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  // If not logged in → send to magic link login with `next` pointing back here
  const loginUrl = `/app/login?next=${encodeURIComponent(`/claim?token=${token}`)}`;

  const cityLabel: Record<string, string> = { riga: "Riga, Latvia", tallinn: "Tallinn, Estonia", vilnius: "Vilnius, Lithuania" };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-brand-950">CarRentDesk</span>
          <p className="mt-1 text-sm text-neutral-500">Operator claim</p>
        </div>

        <div className="rounded-2xl border border-border bg-white px-8 py-8 shadow-sm">
          <div className="mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
              <svg className="h-6 w-6 text-brand-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.745 3.745 0 0 1 3.296-1.043A3.745 3.745 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Activate your operator account</h1>
            <p className="mt-1 text-sm text-neutral-500">
              You&apos;ve been invited to manage your company on CarRentDesk — marketplace listing, fleet, inspections, and bookings in one place.
            </p>
          </div>

          {/* Company card */}
          <div className="mb-6 rounded-xl border border-border bg-slate-50 px-4 py-4">
            <p className="text-base font-semibold text-neutral-900">{company.name}</p>
            <p className="mt-0.5 text-sm text-neutral-500">
              {cityLabel[company.city] ?? company.city}
            </p>
            {ct.sent_to_email && (
              <p className="mt-2 text-xs text-neutral-400">
                Invitation sent to: {ct.sent_to_email}
              </p>
            )}
          </div>

          {user ? (
            <ClaimConfirmButton
              token={token}
              companyName={company.name}
              userEmail={user.email ?? ""}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                First, sign in with your email to verify your identity. Then you&apos;ll be able to confirm the claim.
              </p>
              <a
                href={loginUrl}
                className="flex w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                Sign in to continue
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClaimError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-brand-950">CarRentDesk</span>
        </div>
        <div className="rounded-2xl border border-border bg-white px-8 py-8 shadow-sm text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-lg font-semibold text-neutral-900">Invalid link</h1>
          <p className="text-sm text-neutral-500">{message}</p>
        </div>
      </div>
    </div>
  );
}
