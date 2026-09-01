import type { MetadataRoute } from "next";

import { getSql } from "@/lib/db";
import { listWikiPages } from "@/lib/wiki-pages";
import { getWikiHomeTree, seedWikiStructureIfEmpty } from "@/lib/wiki-structure";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

export const LC_SITEMAP_REVALIDATE_SEC = 3600;
export const LC_SITEMAP_DB_TIMEOUT_MS = 5000;

export const LC_SITEMAP_STATIC_PATHS: {
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

/** Публічний URL для sitemap / canonical (завершальний / лише на головній). */
export function lcSitemapUrl(path: string, base?: string): string {
  const root = (base ?? getLcMarketingSiteUrl()).replace(/\/$/, "");
  if (path === "/" || path === "") return `${root}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${root}${normalized}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timeout after ${ms}ms`)),
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

async function loadWikiEntries(
  base: string,
  now: Date,
): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  await seedWikiStructureIfEmpty();
  const [pages, tree] = await Promise.all([
    listWikiPages(500),
    getWikiHomeTree(),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  for (const page of pages) {
    const slug = page.slug?.trim();
    if (!slug) continue;
    const path = `/wiki/${encodeURIComponent(slug)}`;
    if (seen.has(path)) continue;
    seen.add(path);
    entries.push({
      url: lcSitemapUrl(path, base),
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
      entries.push({
        url: lcSitemapUrl(path, base),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  }

  return entries;
}

async function loadProposalEntries(
  base: string,
  now: Date,
): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  const sql = getSql();
  const rows = await sql`
    SELECT id, created_at, ends_at
    FROM proposals
    ORDER BY id DESC
    LIMIT 300
  `;

  return (rows as { id: number; created_at: Date; ends_at: Date }[]).map(
    (row) => ({
      url: lcSitemapUrl(`/proposals/${row.id}`, base),
      lastModified: row.ends_at ?? row.created_at ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }),
  );
}

async function loadDynamicEntries(
  base: string,
  now: Date,
): Promise<MetadataRoute.Sitemap> {
  const [wiki, proposals] = await Promise.all([
    loadWikiEntries(base, now),
    loadProposalEntries(base, now),
  ]);
  return [...wiki, ...proposals];
}

/** Усі URL для Google Search Console / sitemap.xml */
export async function buildLcSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const base = getLcMarketingSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = LC_SITEMAP_STATIC_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: lcSitemapUrl(path, base),
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    dynamicEntries = await withTimeout(
      loadDynamicEntries(base, now),
      LC_SITEMAP_DB_TIMEOUT_MS,
    );
  } catch {
    /* Neon недоступний — віддаємо статичні URL. */
  }

  return [...staticEntries, ...dynamicEntries];
}

export function lcSitemapPublicUrl(): string {
  return lcSitemapUrl("/sitemap.xml");
}
