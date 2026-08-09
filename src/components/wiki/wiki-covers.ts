/** Дефолтні обкладинки карток вікі за типом розділу (slug категорії). */

const DEFAULT_COVER = "/wiki-covers/wiki-cover-default.webp";

const BY_SLUG: Record<string, string> = {
  Держави: "/wiki-covers/wiki-cover-derzhavy.webp",
  Державні_Утворення: "/wiki-covers/wiki-cover-utvorennya.webp",
  Мегаполіси: "/wiki-covers/wiki-cover-megapolis.webp",
  Міста: "/wiki-covers/wiki-cover-mista.webp",
  Поселення: "/wiki-covers/wiki-cover-poselennya.webp",
  Гравці: "/wiki-covers/wiki-cover-gravtsi.webp",
  Лор_серверу: "/wiki-covers/wiki-cover-lor.webp",
  Історія_проєкту: "/wiki-covers/wiki-cover-istoriya.webp",
  RP_новини: "/wiki-covers/wiki-cover-rp-novyny.webp",
  Довідник_цін: "/wiki-covers/wiki-cover-tsiny.webp",
};

export function wikiDefaultCoverForSlug(slug: string): string {
  return BY_SLUG[slug] ?? DEFAULT_COVER;
}

/** Власне фото картки або універсальна обкладинка розділу. */
export function wikiCardImageUrl(
  categorySlug: string,
  customImageUrl?: string | null,
): string {
  const custom = customImageUrl?.trim();
  if (custom) return custom;
  return wikiDefaultCoverForSlug(categorySlug);
}

export function isLocalWikiCover(src: string): boolean {
  return src.startsWith("/wiki-covers/");
}
