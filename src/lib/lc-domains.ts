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
  "lost-chronicles.pp.ua",
  "www.lost-chronicles.pp.ua",
  "lost-chronicles.com",
  "www.lost-chronicles.com",
] as const;

const LEGACY_HOST_SET = new Set<string>(
  LC_LEGACY_MARKETING_HOSTS.map((h) => h.toLowerCase()),
);

/** Чи хост — колишній маркетинговий домен або www-варіант канонічного. */
export function isLegacyLcMarketingHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0] ?? "";
  return LEGACY_HOST_SET.has(h) || h === `www.${LC_MARKETING_HOST}`;
}

/**
 * Нормалізує URL сайту: колишні домени та www → apex .co.ua.
 * Якщо candidate порожній — бере NEXT_PUBLIC_SITE_URL.
 */
export function resolveLcMarketingSiteUrl(candidate?: string): string {
  const raw = (candidate ?? process.env.NEXT_PUBLIC_SITE_URL ?? "")
    .replace(/\/$/, "")
    .trim();
  if (!raw) return LC_MARKETING_SITE_ORIGIN;

  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.toLowerCase();
    if (isLegacyLcMarketingHost(hostname)) return LC_MARKETING_SITE_ORIGIN;
    if (hostname === LC_MARKETING_HOST) return LC_MARKETING_SITE_ORIGIN;
    return parsed.origin;
  } catch {
    return LC_MARKETING_SITE_ORIGIN;
  }
}
