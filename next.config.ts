import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Redirect www to non-www. Eliminates the 141-page duplicate index
      // Google built at www.carrentdesk.com and consolidates all link equity.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.carrentdesk.com" }],
        destination: "https://carrentdesk.com/:path*",
        permanent: true, // 301
      },
      {
        source: "/for-rentals",
        destination: "/join",
        permanent: true, // 301
      },
    ];
  },
};

export default nextConfig;
