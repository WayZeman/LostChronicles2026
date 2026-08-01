import type { MetadataRoute } from "next";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

/** Публічні маршрути для індексації (динамічні wiki/proposals можна додати окремо). */
const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] =
  [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/faq", priority: 0.9, changeFrequency: "monthly" },
    { path: "/wiki", priority: 0.85, changeFrequency: "weekly" },
    { path: "/map", priority: 0.85, changeFrequency: "weekly" },
    { path: "/news", priority: 0.8, changeFrequency: "weekly" },
    { path: "/proposals", priority: 0.75, changeFrequency: "weekly" },
    { path: "/support", priority: 0.7, changeFrequency: "monthly" },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getLcMarketingSiteUrl();
  const lastModified = new Date();

  return STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
