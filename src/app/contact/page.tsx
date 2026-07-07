import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the CarRentDesk team. We're happy to help with questions about listings, corrections, or anything else.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        Contact us
      </h1>

      <div className="mt-10 space-y-8 text-base leading-7 text-neutral-700">
        <p>
          The best way to reach us is by email. We typically respond within one business day.
        </p>

        <div className="rounded-xl border border-border bg-surface-soft p-6">
          <p className="font-medium text-neutral-900">General enquiries</p>
          <a
            href="mailto:info@carrentdesk.com"
            className="mt-1 block text-brand-700 hover:underline"
          >
            info@carrentdesk.com
          </a>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Rental companies</h2>
          <p className="mt-3">
            If you want to add or claim a listing for your business, please visit the{" "}
            <Link href="/join" className="text-brand-700 hover:underline">
              rental owner page
            </Link>{" "}
            for information on how to get listed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Report an error</h2>
          <p className="mt-3">
            Spotted outdated information, a closed company, or incorrect details? Email us at{" "}
            <a
              href="mailto:info@carrentdesk.com"
              className="text-brand-700 hover:underline"
            >
              info@carrentdesk.com
            </a>{" "}
            with the company name and what needs correcting. We'll update it promptly.
          </p>
        </section>
      </div>
    </div>
  );
}
