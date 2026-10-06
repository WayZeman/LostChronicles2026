import type { MetadataRoute } from "next";

import { LC_MARKETING_HOST } from "@/lib/lc-domains";
import { lcSitemapPublicUrl, lcSitemapUrl } from "@/lib/lc-sitemap-entries";

const PUBLIC_DISALLOW = [
  "/api/",
  "/admin",
  "/admin/",
  "/profile",
  "/profile/",
  "/auth-required",
  "/wiki/new",
];

const AI_CRAWLERS = [
  "GPTBot",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "anthropic-ai",
  "Bytespider",
  "Yandex",
  "YandexBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PUBLIC_DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PUBLIC_DISALLOW,
      })),
    ],
    sitemap: [
      lcSitemapPublicUrl(),
      lcSitemapUrl("/sitemap.xml"),
    ],
    host: LC_MARKETING_HOST,
  };
}
