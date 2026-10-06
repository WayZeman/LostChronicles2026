import type { MetadataRoute } from "next";

import {
  buildLcSitemapEntries,
  lcSitemapLastmod,
  lcSitemapUrl,
} from "@/lib/lc-sitemap-entries";

const XML_HEADERS = {
  "Content-Type": "text/xml; charset=utf-8",
  "Cache-Control":
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
} as const;

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function entryLastmod(entry: MetadataRoute.Sitemap[number]): string {
  return lcSitemapLastmod(
    entry.lastModified instanceof Date
      ? entry.lastModified
      : entry.lastModified
        ? String(entry.lastModified)
        : null,
  );
}

/** Чистий urlset без content-disposition від MetadataRoute. */
export async function buildLcUrlsetXml(): Promise<string> {
  const entries = await buildLcSitemapEntries();
  const rows = entries
    .map((entry) => {
      const parts = [
        "<url>",
        `<loc>${xmlEscape(entry.url)}</loc>`,
        `<lastmod>${entryLastmod(entry)}</lastmod>`,
      ];
      if (entry.changeFrequency) {
        parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (typeof entry.priority === "number") {
        parts.push(`<priority>${entry.priority}</priority>`);
      }
      parts.push("</url>");
      return parts.join("");
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows}</urlset>\n`;
}

/** Справжній sitemapindex (не urlset під назвою index). */
export function buildLcSitemapIndexXml(): string {
  const now = lcSitemapLastmod(new Date());
  const pages = xmlEscape(lcSitemapUrl("/sitemaps/pages.xml"));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${pages}</loc><lastmod>${now}</lastmod></sitemap></sitemapindex>\n`;
}

export function lcSitemapXmlResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: XML_HEADERS,
  });
}
