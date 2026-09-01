import type { MetadataRoute } from "next";

import { LC_MARKETING_HOST } from "@/lib/lc-domains";
import { lcSitemapPublicUrl } from "@/lib/lc-sitemap-entries";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: lcSitemapPublicUrl(),
    host: LC_MARKETING_HOST,
  };
}
