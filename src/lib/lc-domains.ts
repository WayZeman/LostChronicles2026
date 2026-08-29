/** Публічний маркетинговий домен (apex, без www). */
export const LC_MARKETING_HOST = "lost-chronicles.co.ua";

/** Повний origin сайту для SEO, OG, sitemap, User-Agent. */
export const LC_MARKETING_SITE_ORIGIN = `https://${LC_MARKETING_HOST}`;

/** Java/Bedrock адреса за замовчуванням. */
export const LC_PLAY_HOST = `play.${LC_MARKETING_HOST}`;

/** Колишні домени сайту → 301 на LC_MARKETING_HOST. */
export const LC_LEGACY_MARKETING_HOSTS = [
  "lost-chronicles.site",
  "www.lost-chronicles.site",
] as const;
