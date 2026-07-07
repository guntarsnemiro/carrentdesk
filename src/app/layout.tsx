import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://carrentdesk.com"),
  title: {
    default: "CarRentDesk — Find independent local car rentals",
    template: "%s · CarRentDesk",
  },
  description:
    "Best local car rentals across Europe. 6,500+ companies, direct contact, no booking fees. Skip the big chains and rent direct.",
  openGraph: {
    type: "website",
    siteName: "CarRentDesk",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CarRentDesk",
  url: "https://carrentdesk.com",
  logo: "https://carrentdesk.com/opengraph-image",
  description:
    "Directory of independent car rental companies. Direct contact, fair prices, no middleman.",
  areaServed: "Europe",
  sameAs: [] as string[],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <SiteFooter />
        <GoogleAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSONLD),
          }}
        />
      </body>
    </html>
  );
}
