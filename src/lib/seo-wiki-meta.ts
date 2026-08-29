import type { Metadata } from "next";

import { LC_SEO_DESCRIPTION_SHORT } from "@/data/lc-seo-terms";
import {
  getCachedWikiCategoryBySlug,
  getCachedWikiPageBySlug,
} from "@/lib/public-content-cache";
import { buildLcPageMetadata, stripHtmlForSeo } from "@/lib/seo";
import { isRpNewsWikiSlug } from "@/lib/telegram-rp-news";
import { isWikiHomeSlug } from "@/lib/wiki-home-slug";

export async function buildWikiSlugMetadata(
  rawSlug: string,
): Promise<Metadata | null> {
  const slug = decodeURIComponent(rawSlug);

  if (isWikiHomeSlug(slug)) return null;

  if (isRpNewsWikiSlug(slug)) {
    return buildLcPageMetadata({
      title: "RP новини — вікі Lost Chronicles",
      description:
        "Офіційні RP-новини світу Lost Chronicles: події, оновлення та оголошення для гравців Minecraft-сервера.",
      path: `/wiki/${encodeURIComponent(slug)}`,
      ogType: "article",
    });
  }

  const category = await getCachedWikiCategoryBySlug(slug);
  if (category) {
    const desc =
      category.description?.trim() ||
      `Розділ вікі «${category.title}» — правила, лор і гайди сервера Lost Chronicles (Minecraft Україна).`;
    return buildLcPageMetadata({
      title: `${category.title} — вікі Lost Chronicles`,
      description: desc.slice(0, 160),
      path: `/wiki/${encodeURIComponent(slug)}`,
    });
  }

  const page = await getCachedWikiPageBySlug(slug);
  if (!page) return null;

  const summary =
    page.summary?.trim() ||
    stripHtmlForSeo(page.content_html, 155) ||
    LC_SEO_DESCRIPTION_SHORT;

  return buildLcPageMetadata({
    title: `${page.title} — вікі Lost Chronicles`,
    description: summary,
    path: `/wiki/${encodeURIComponent(page.slug)}`,
    ogType: "article",
  });
}
