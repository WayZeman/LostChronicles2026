/** Дефолтні обкладинки карток вікі за типом розділу (slug категорії). */

const DEFAULT_COVER = "/wiki-covers/wiki-cover-default.jpg";

const BY_SLUG: Record<string, string> = {
  Держави: "/wiki-covers/wiki-cover-derzhavy.jpg",
  Державні_Утворення: "/wiki-covers/wiki-cover-utvorennya.jpg",
  Мегаполіси: "/wiki-covers/wiki-cover-megapolis.jpg",
  Міста: "/wiki-covers/wiki-cover-mista.jpg",
  Поселення: "/wiki-covers/wiki-cover-poselennya.jpg",
  Гравці: "/wiki-covers/wiki-cover-gravtsi.jpg",
  Лор_серверу: "/wiki-covers/wiki-cover-lor.jpg",
  Історія_проєкту: "/wiki-covers/wiki-cover-istoriya.jpg",
  RP_новини: "/wiki-covers/wiki-cover-rp-novyny.jpg",
  Довідник_цін: "/wiki-covers/wiki-cover-tsiny.jpg",
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
