import { getWikiPageBySlug } from "@/lib/wiki-pages";

/** Slug головної сторінки (як у колишньому Fandom URL /wiki/Main_Page). */
export const WIKI_HOME_SLUG = "Main_Page";

const HOME_SLUG_ALIASES = [WIKI_HOME_SLUG, "main_page"] as const;

export function isWikiHomeSlug(slug: string): boolean {
  const n = slug.trim();
  return HOME_SLUG_ALIASES.some((s) => s.toLowerCase() === n.toLowerCase());
}

export type WikiHomeResolved = {
  title: string;
  html: string;
};

export async function resolveWikiHomeContent(): Promise<WikiHomeResolved | null> {
  const page = await getWikiPageBySlug(WIKI_HOME_SLUG);
  if (!page) return null;
  return {
    title: page.title,
    html: page.content_html,
  };
}
