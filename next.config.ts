import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage — vehicle photos, logos
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Serve modern formats; browsers that support AVIF get it first
    formats: ["image/avif", "image/webp"],
  },

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
