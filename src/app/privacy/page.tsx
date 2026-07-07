import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "CarRentDesk privacy policy — how we collect, use, and protect your data in compliance with GDPR.",
};

const LAST_UPDATED = "1 July 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-8 text-base leading-7 text-neutral-700">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900">1. Who we are</h2>
          <p className="mt-3">
            CarRentDesk (<strong>carrentdesk.com</strong>) is an online directory of
            independent car rental companies across Europe. References to "we", "us", or
            "our" in this policy refer to the operator of carrentdesk.com.
          </p>
          <p className="mt-3">
            For privacy enquiries, contact us at{" "}
            <a href="mailto:info@carrentdesk.com" className="text-brand-700 hover:underline">
              info@carrentdesk.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">2. Data we collect</h2>
          <p className="mt-3">
            <strong>Visitors to the public directory</strong> — We collect anonymised
            analytics data (pages visited, approximate location by country, device type,
            referral source) via Google Analytics 4. This data does not identify you
            personally. We use cookies as described in section 4.
          </p>
          <p className="mt-3">
            <strong>Rental company accounts</strong> — If you register a business account
            to manage a listing, we collect your name, business email address, company
            details, and any information you submit through the platform. This data is
            stored securely in our database and is used solely to operate your listing.
          </p>
          <p className="mt-3">
            We do not collect payment card details directly. Payments are processed by
            third-party providers subject to their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">3. How we use your data</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>To operate and improve the CarRentDesk directory</li>
            <li>To manage rental company accounts and listings</li>
            <li>To respond to enquiries sent to info@carrentdesk.com</li>
            <li>To send transactional emails related to your account (if applicable)</li>
            <li>To analyse aggregate usage patterns and improve site performance</li>
          </ul>
          <p className="mt-3">
            We do not sell personal data to third parties, and we do not use your data for
            advertising profiling.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">4. Cookies</h2>
          <p className="mt-3">
            We use cookies for analytics (Google Analytics 4) and session management for
            logged-in business accounts. Google Analytics cookies collect anonymised data.
            You can opt out of Google Analytics tracking via your browser settings or by
            using the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 hover:underline"
            >
              Google Analytics Opt-out Add-on
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">5. Third-party services</h2>
          <p className="mt-3">We use the following third-party services to operate the site:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Supabase</strong> — database and authentication (EU region)
            </li>
            <li>
              <strong>Vercel</strong> — hosting and content delivery
            </li>
            <li>
              <strong>Google Analytics 4</strong> — anonymised usage analytics
            </li>
            <li>
              <strong>Amazon SES</strong> — transactional email delivery
            </li>
          </ul>
          <p className="mt-3">
            Each provider is subject to their own privacy policy and data processing
            agreements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">6. Data retention</h2>
          <p className="mt-3">
            Analytics data is retained for 14 months in Google Analytics. Account data is
            retained for as long as your account is active. You may request deletion at any
            time by emailing{" "}
            <a href="mailto:info@carrentdesk.com" className="text-brand-700 hover:underline">
              info@carrentdesk.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">7. Your rights (GDPR)</h2>
          <p className="mt-3">
            If you are located in the European Economic Area, you have the right to access,
            correct, or delete the personal data we hold about you, to restrict or object to
            processing, and to data portability. To exercise any of these rights, contact us
            at{" "}
            <a href="mailto:info@carrentdesk.com" className="text-brand-700 hover:underline">
              info@carrentdesk.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">8. Changes to this policy</h2>
          <p className="mt-3">
            We may update this policy from time to time. The date at the top of this page
            reflects the most recent revision. Continued use of the site after changes are
            posted constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}
