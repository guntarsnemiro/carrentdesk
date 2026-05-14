import type { Metadata } from "next";
import { MagicLinkForm } from "./_components/magic-link-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-brand-950">
            CarRentDesk
          </span>
          <p className="mt-1 text-sm text-neutral-500">Operator portal</p>
        </div>

        <div className="rounded-2xl border border-border bg-white px-8 py-8 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold text-neutral-900">
            Sign in to your account
          </h1>
          <p className="mb-6 text-sm text-neutral-500">
            Enter your email and we&apos;ll send you a one-time sign-in link.
            No password needed.
          </p>

          <MagicLinkForm searchParams={searchParams} />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Don&apos;t have an account?{" "}
          <a
            href="/for-rentals"
            className="text-brand-700 underline-offset-2 hover:underline"
          >
            Request access
          </a>
        </p>
      </div>
    </div>
  );
}
