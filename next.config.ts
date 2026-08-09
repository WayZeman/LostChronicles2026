import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const isDev = process.env.NODE_ENV !== "production";

/** У local dev браузер і проміжні шари не тримають старий HTML/асети. */
const noStoreDevHeaders = isDev
  ? [
      {
        key: "Cache-Control",
        value: "no-store, no-cache, must-revalidate, max-age=0",
      },
      { key: "Pragma", value: "no-cache" },
    ]
  : [];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...noStoreDevHeaders],
      },
      {
        source: "/wiki-covers/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-store"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-store"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:file(logo.png|lc-logo-hero-v2.png|bg-ivy-stone.jpg|bg-ivy-stone-portrait.jpg|map-hero.png|social-mascot.png|server-status-online.png|server-status-offline.png|server-online-zombie.png)",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-store"
              : "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
