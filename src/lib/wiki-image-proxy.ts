/**
 * Проксі зображень Fandom/Wikia: CDN часто блокує пряме завантаження з чужого сайту (Referer).
 * Дозволені лише відомі хости CDN вікі.
 */

const ALLOWED_HOST_SUFFIXES = [".wikia.nocookie.net"];
const ALLOWED_HOSTS = new Set(["images.wikia.com"]);

/**
 * У HTML з MediaWiki в атрибутах часто `&amp;` замість `&` у query.
 * Запит з буквальним `&amp;` до static.wikia дає 404.
 */
export function decodeWikiImgSrcUrl(url: string): string {
  return url
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#38;/g, "&");
}

export function isWikiCdnImageUrl(url: string): boolean {
  try {
    const u = new URL(decodeWikiImgSrcUrl(url));
    if (u.protocol !== "https:") return false;
    if (ALLOWED_HOSTS.has(u.hostname)) return true;
    return ALLOWED_HOST_SUFFIXES.some((s) => u.hostname.endsWith(s));
  } catch {
    return false;
  }
}

/** Абсолютний https URL для атрибутів img (Fandom: //, відносні шляхи, http). */
export function normalizeImageUrlForProxy(
  raw: string,
  fandomBase: string,
): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("//")) return decodeWikiImgSrcUrl(`https:${t}`);
  if (t.startsWith("https://")) return decodeWikiImgSrcUrl(t);
  if (t.startsWith("http://")) {
    try {
      const u = new URL(t);
      u.protocol = "https:";
      return decodeWikiImgSrcUrl(u.href);
    } catch {
      return null;
    }
  }
  if (t.startsWith("/")) {
    try {
      const base = fandomBase.replace(/\/+$/, "");
      return decodeWikiImgSrcUrl(new URL(t, `${base}/`).href);
    } catch {
      return null;
    }
  }
  return null;
}

export const WIKI_IMAGE_PROXY_PATH = "/api/wiki-image";
