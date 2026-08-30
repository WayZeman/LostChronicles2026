import type { MetadataRoute } from "next";

import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

/**
 * Статичний sitemap без Neon — Googlebot не чекає на БД.
 * Сторінки вікі індексуються через посилання з /wiki; окремі URL додамо, коли БД стабільна.
 */
export const revalidate = 3600;

const STATIC_PATHS: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
}[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/faq", priority: 0.95, changeFrequency: "weekly" },
  { path: "/apply", priority: 0.95, changeFrequency: "monthly" },
  { path: "/wiki", priority: 0.9, changeFrequency: "daily" },
  { path: "/map", priority: 0.85, changeFrequency: "weekly" },
  { path: "/news", priority: 0.85, changeFrequency: "daily" },
  { path: "/proposals", priority: 0.85, changeFrequency: "daily" },
  { path: "/support", priority: 0.75, changeFrequency: "monthly" },
];

function sitemapUrl(base: string, path: string): string {
  const root = base.replace(/\/$/, "");
  if (path === "/") return `${root}/`;
  return `${root}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getLcMarketingSiteUrl();
  const now = new Date();

  return STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: sitemapUrl(base, path),
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
