import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of use for CarRentDesk — the directory of independent local car rental companies across Europe.",
};

const LAST_UPDATED = "1 July 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        Terms of Use
      </h1>
      <p className="mt-3 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-8 text-base leading-7 text-neutral-700">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900">1. About CarRentDesk</h2>
          <p className="mt-3">
            CarRentDesk is an online directory that lists independent car rental companies
            across Europe. We do not rent cars ourselves and are not party to any rental
            agreement between you and a listed company. By using this site you agree to
            these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">2. Directory listings</h2>
          <p className="mt-3">
            Listings on CarRentDesk are provided for informational purposes. We make
            reasonable efforts to keep information accurate but cannot guarantee that
            pricing, availability, contact details, or company status are up to date. Always
            confirm details directly with the rental company before making a booking.
          </p>
          <p className="mt-3">
            CarRentDesk is not responsible for any loss, damage, or dispute arising from
            your interaction with a listed rental company.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">3. Rental company accounts</h2>
          <p className="mt-3">
            Rental companies that register an account on CarRentDesk agree to provide
            accurate, current information about their business. Listings that contain false,
            misleading, or spam content will be removed without notice.
          </p>
          <p className="mt-3">
            By submitting a listing you confirm that you are authorised to represent the
            business and that the information provided is accurate to the best of your
            knowledge.
          </p>
          <p className="mt-3">
            For details on paid features and subscription terms, see the{" "}
            <Link href="/join#pricing" className="text-brand-700 hover:underline">
              pricing section
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">4. Intellectual property</h2>
          <p className="mt-3">
            The CarRentDesk name, logo, and site content are the property of CarRentDesk.
            You may not reproduce or redistribute any part of this site without written
            permission. Company names, logos, and descriptions submitted by rental companies
            remain the property of those companies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">5. Limitation of liability</h2>
          <p className="mt-3">
            CarRentDesk is provided "as is" without warranties of any kind. To the fullest
            extent permitted by law, we exclude all liability for any indirect, incidental,
            or consequential loss arising from your use of this site or reliance on
            information contained within it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">6. Governing law</h2>
          <p className="mt-3">
            These terms are governed by the laws of the European Union and the jurisdiction
            in which CarRentDesk operates. Any disputes will be subject to the exclusive
            jurisdiction of the relevant courts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">7. Changes to these terms</h2>
          <p className="mt-3">
            We may revise these terms at any time. The date at the top of this page reflects
            the latest update. Continued use of the site after changes are posted constitutes
            acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">8. Contact</h2>
          <p className="mt-3">
            Questions about these terms? Email us at{" "}
            <a href="mailto:info@carrentdesk.com" className="text-brand-700 hover:underline">
              info@carrentdesk.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
