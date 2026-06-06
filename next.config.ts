import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/for-rentals",
        destination: "/join",
        permanent: true, // 301
      },
    ];
  },
};

export default nextConfig;
