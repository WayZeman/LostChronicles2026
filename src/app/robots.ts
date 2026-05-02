import type { MetadataRoute } from "next";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

export default function robots(): MetadataRoute.Robots {
  const base = getLcMarketingSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
