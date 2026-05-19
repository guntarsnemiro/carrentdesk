import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./_components/join-form";

export const metadata: Metadata = {
  title: "Start free trial · CarRentDesk",
  description: "Create your CarRentDesk account and start managing your fleet in minutes.",
};

export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-border bg-white px-6 py-4">
        <Link href="/" className="text-sm font-bold text-brand-950">
          CarRentDesk
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-border bg-white px-8 py-9 shadow-sm">
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-bold text-neutral-900">Start your free trial</h1>
              <p className="mt-2 text-sm text-neutral-500">
                Get your fleet, bookings, and customers in one place.
                <br />No credit card needed.
              </p>
            </div>
            <JoinForm />
          </div>

          {/* Already have an account */}
          <p className="mt-5 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/app/login" className="font-medium text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
