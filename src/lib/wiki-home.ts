import { getWikiPageBySlug } from "@/lib/wiki-pages";
import { WIKI_HOME_SLUG, isWikiHomeSlug } from "@/lib/wiki-home-slug";

export { WIKI_HOME_SLUG, isWikiHomeSlug };

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
