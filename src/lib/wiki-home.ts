import { fetchFandomPageHtml } from "@/lib/fandom";

/** Slug головної сторінки (як у Fandom URL /wiki/Main_Page). */
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
  const parsed = await fetchFandomPageHtml("Main Page");
  if (!parsed) return null;

  return {
    title: parsed.title,
    html: parsed.html,
  };
}
