import Link from "next/link";

export function ClaimSidebarCard({ companyName }: { companyId?: string; companyName: string }) {
  return (
    <div className="rounded-2xl bg-brand-950 p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">Own {companyName}?</p>
      <p className="mt-2 text-sm text-brand-100">Create an account and manage your cars from the office.</p>
      <Link
        href="/join"
        className="mt-3 block w-full rounded-lg bg-white py-2 text-center text-sm font-semibold text-brand-950 hover:bg-brand-100"
      >
        Create an account
      </Link>
    </div>
  );
}
