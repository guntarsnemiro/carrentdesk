import Script from "next/script";

/**
 * Loads Ahrefs Web Analytics when `NEXT_PUBLIC_AHREFS_ANALYTICS_KEY` is set.
 * Skips entirely when unset so local / preview builds stay clean.
 */
export function AhrefsAnalytics() {
  const key = process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY?.trim();
  if (!key) return null;

  return (
    <Script
      src="https://analytics.ahrefs.com/analytics.js"
      data-key={key}
      strategy="afterInteractive"
    />
  );
}
