import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About CarRentDesk",
  description:
    "CarRentDesk is a directory of independent local car rental companies across Europe. We connect travellers directly with local operators — no middleman, no hidden fees.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        About CarRentDesk
      </h1>

      <div className="mt-10 space-y-8 text-base leading-7 text-neutral-700">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900">What we do</h2>
          <p className="mt-3">
            CarRentDesk is a marketplace for independent, locally-owned car rental companies
            across Europe. We help travellers find and compare alternatives to the big chains —
            companies that know their local roads, offer direct contact, and don't charge
            platform commission on top of the rental price.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Why we built it</h2>
          <p className="mt-3">
            Most car rental search engines push the same handful of global brands and take a
            cut from every booking. Local operators — often offering better prices, more
            flexibility, and a more personal service — are almost invisible online.
          </p>
          <p className="mt-3">
            CarRentDesk exists to level that playing field. We index independent rental
            companies across the Baltics, Scandinavia, Western Europe, and beyond, and give
            travellers a way to contact them directly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Coverage</h2>
          <p className="mt-3">
            We currently list companies in cities across Estonia, Latvia, Lithuania, Finland,
            Sweden, Norway, Denmark, Germany, the Netherlands, Belgium, Luxembourg, the United
            Kingdom, Ireland, Switzerland, Austria, and Turkey — with more regions being added
            regularly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">For rental companies</h2>
          <p className="mt-3">
            If you run an independent car rental business and want to appear in our directory,
            visit our{" "}
            <Link href="/join" className="text-brand-700 hover:underline">
              listing page
            </Link>{" "}
            to claim or add your company. Basic listings are free.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
          <p className="mt-3">
            Questions, corrections, or partnership enquiries — reach us at{" "}
            <a
              href="mailto:info@carrentdesk.com"
              className="text-brand-700 hover:underline"
            >
              info@carrentdesk.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
