import type { MetadataRoute } from "next";

import { LC_MARKETING_HOST } from "@/lib/lc-domains";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

export default function robots(): MetadataRoute.Robots {
  const base = getLcMarketingSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/profile",
          "/profile/",
          "/auth-required",
          "/wiki/new",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: LC_MARKETING_HOST,
  };
}
