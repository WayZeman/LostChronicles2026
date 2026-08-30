import type { MetadataRoute } from "next";

import { listWikiPages } from "@/lib/wiki-pages";
import { getWikiHomeTree, seedWikiStructureIfEmpty } from "@/lib/wiki-structure";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

/** Кеш sitemap на edge — Googlebot отримує швидку відповідь без cold start. */
export const revalidate = 3600;

const WIKI_FETCH_TIMEOUT_MS = 4000;

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

async function loadWikiSitemapEntries(
  base: string,
  now: Date,
): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  await seedWikiStructureIfEmpty();
  const [pages, tree] = await Promise.all([
    listWikiPages(500),
    getWikiHomeTree(),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  for (const page of pages) {
    const slug = page.slug?.trim();
    if (!slug) continue;
    const path = `/wiki/${encodeURIComponent(slug)}`;
    if (seen.has(path)) continue;
    seen.add(path);
    dynamicEntries.push({
      url: sitemapUrl(base, path),
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
        url: sitemapUrl(base, path),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  }

  return dynamicEntries;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`sitemap timeout after ${ms}ms`)),
      ms,
    );
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getLcMarketingSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: sitemapUrl(base, path),
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    dynamicEntries = await withTimeout(
      loadWikiSitemapEntries(base, now),
      WIKI_FETCH_TIMEOUT_MS,
    );
  } catch {
    /* БД недоступна або таймаут — віддаємо лише статичні URL (Googlebot не чекає). */
  }

  return [...staticEntries, ...dynamicEntries];
}
