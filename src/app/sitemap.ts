import type { MetadataRoute } from "next";

import { buildLcSitemapEntries } from "@/lib/lc-sitemap-entries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildLcSitemapEntries();
}
