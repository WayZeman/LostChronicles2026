import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { resolveWikiHomeContent } from "@/lib/wiki-home";
import { getWikiPageBySlug } from "@/lib/wiki-pages";
import {
  getWikiCategoryBySlug,
  getWikiHomeTree,
} from "@/lib/wiki-structure";
import { listFaqItems } from "@/lib/site-content";

export const WIKI_PUBLIC_CACHE_TAG = "wiki-public";
export const FAQ_PUBLIC_CACHE_TAG = "faq-public";

const WIKI_REVALIDATE_SEC = 300;
const FAQ_REVALIDATE_SEC = 300;

export const getCachedWikiHomeTree = unstable_cache(
  async () => getWikiHomeTree(),
  ["wiki-home-tree-v1"],
  { revalidate: WIKI_REVALIDATE_SEC, tags: [WIKI_PUBLIC_CACHE_TAG] },
);

export const getCachedWikiHomeContent = unstable_cache(
  async () => resolveWikiHomeContent(),
  ["wiki-home-content-v1"],
  { revalidate: WIKI_REVALIDATE_SEC, tags: [WIKI_PUBLIC_CACHE_TAG] },
);

const getCachedWikiPageBySlugInner = unstable_cache(
  async (slug: string) => getWikiPageBySlug(slug),
  ["wiki-page-by-slug-v1"],
  { revalidate: WIKI_REVALIDATE_SEC, tags: [WIKI_PUBLIC_CACHE_TAG] },
);

const getCachedWikiCategoryBySlugInner = unstable_cache(
  async (slug: string) => getWikiCategoryBySlug(slug),
  ["wiki-category-by-slug-v1"],
  { revalidate: WIKI_REVALIDATE_SEC, tags: [WIKI_PUBLIC_CACHE_TAG] },
);

export async function getCachedWikiPageBySlug(slug: string) {
  return getCachedWikiPageBySlugInner(slug);
}

export async function getCachedWikiCategoryBySlug(slug: string) {
  return getCachedWikiCategoryBySlugInner(slug);
}

export const getCachedFaqItems = unstable_cache(
  async () => listFaqItems(),
  ["faq-items-v1"],
  { revalidate: FAQ_REVALIDATE_SEC, tags: [FAQ_PUBLIC_CACHE_TAG] },
);

/** Скидає публічний кеш вікі після правок у адмінці / API. */
export function revalidateWikiPublic() {
  try {
    revalidateTag(WIKI_PUBLIC_CACHE_TAG, { expire: 0 });
  } catch {
    /* ignore outside request scope */
  }
  try {
    revalidatePath("/wiki");
  } catch {
    /* ignore */
  }
}

export function revalidateFaqPublic() {
  try {
    revalidateTag(FAQ_PUBLIC_CACHE_TAG, { expire: 0 });
  } catch {
    /* ignore */
  }
  try {
    revalidatePath("/faq");
  } catch {
    /* ignore */
  }
}
