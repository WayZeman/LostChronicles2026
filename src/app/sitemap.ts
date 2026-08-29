import type { MetadataRoute } from "next";

import { listWikiPages } from "@/lib/wiki-pages";
import { getWikiHomeTree, seedWikiStructureIfEmpty } from "@/lib/wiki-structure";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

const STATIC_PATHS: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
}[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/faq", priority: 0.95, changeFrequency: "weekly" },
  { path: "/apply", priority: 0.95, changeFrequency: "monthly" },
  { path: "/wiki", priority: 0.9, changeFrequency: "daily" },
  { path: "/map", priority: 0.85, changeFrequency: "weekly" },
  { path: "/news", priority: 0.85, changeFrequency: "daily" },
  { path: "/proposals", priority: 0.85, changeFrequency: "daily" },
  { path: "/support", priority: 0.75, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getLcMarketingSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  const dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    await seedWikiStructureIfEmpty();
    const [pages, tree] = await Promise.all([
      listWikiPages(500),
      getWikiHomeTree(),
    ]);

    const seen = new Set<string>();

    for (const page of pages) {
      const slug = page.slug?.trim();
      if (!slug) continue;
      const path = `/wiki/${encodeURIComponent(slug)}`;
      if (seen.has(path)) continue;
      seen.add(path);
      dynamicEntries.push({
        url: `${base}${path}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const section of tree.sections) {
      for (const cat of section.categories) {
        const slug = cat.slug?.trim();
        if (!slug) continue;
        const path = `/wiki/${encodeURIComponent(slug)}`;
        if (seen.has(path)) continue;
        seen.add(path);
        dynamicEntries.push({
          url: `${base}${path}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.65,
        });
      }
    }
  } catch {
    /* wiki tables may be unavailable during build */
  }

  return [...staticEntries, ...dynamicEntries];
}
