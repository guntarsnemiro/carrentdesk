import Script from "next/script";

/** GA4 measurement IDs are always `G-` + alphanumeric (public, non-secret). */
const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/i;

/**
 * Loads gtag.js when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (e.g. in Vercel or
 * `.env.local`). Skips entirely when unset so local / preview builds stay clean.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id || !GA_MEASUREMENT_ID.test(id)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');
        `.trim()}
      </Script>
    </>
  );
}
