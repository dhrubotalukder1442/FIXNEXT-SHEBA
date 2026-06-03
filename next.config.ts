import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Image optimization — remote image URL গুলো allow করো
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // ✅ Gzip compression চালু (self-host এ দরকার, Vercel তে auto)
  compress: true,

  // ✅ React strict mode — double render করে bugs ধরে
  reactStrictMode: true,

  // ✅ SSLCommerz POST callback এর জন্য CORS header
  // SSLCommerz তার server থেকে POST করে payment/success এ
  // সেটা allow করতে এই header দরকার
  async headers() {
    return [
      {
        source: "/api/payment/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;