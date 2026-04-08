import {
  decodeWikiImgSrcUrl,
  isWikiCdnImageUrl,
  WIKI_IMAGE_PROXY_PATH,
} from "@/lib/wiki-image-proxy";

/**
 * Fandom (MediaWiki API) — лише вміст статті (parse), без оболонки сайту.
 *
 * На Vercel змінні з локального .env не підставляються — без них використовується дефолтна укр. вікі Lost Chronicles.
 *
 * .env / Environment (опційно, перебивають дефолт):
 *   FANDOM_WIKI_URL=https://lost-chronicles.fandom.com/uk/wiki/Main_Page   (шлях після /wiki/… для API відсікається)
 *   FANDOM_NEWS_PAGE_URL=…/wiki/Новини_серверу
 *   FANDOM_NEWS_PAGE=Новини_серверу
 */

/** Дефолт, якщо FANDOM_WIKI_URL не задано (наприклад на Vercel без env). */
export const DEFAULT_FANDOM_WIKI_URL =
  "https://lost-chronicles.fandom.com/uk/wiki/Main_Page";

/** Корінь вікі для MediaWiki API (…/uk), без /wiki/…. */
function normalizeFandomWikiBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  try {
    const u = new URL(trimmed);
    u.hash = "";
    u.search = "";
    const wikiIdx = u.pathname.indexOf("/wiki/");
    if (wikiIdx >= 0) {
      const prefix = u.pathname.slice(0, wikiIdx);
      u.pathname = prefix === "" ? "/" : prefix;
    }
    return u.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

export function getFandomWikiBase(): string {
  const raw =
    process.env.FANDOM_WIKI_URL?.trim() || DEFAULT_FANDOM_WIKI_URL;
  return normalizeFandomWikiBase(raw);
}

/**
 * Назва сторінки новин для API (пробіли замість _).
 * Пріоритет: FANDOM_NEWS_PAGE_URL (повний URL сторінки) → FANDOM_NEWS_PAGE → «Новини серверу».
 */
export function getFandomNewsPageTitle(): string {
  const urlRaw = process.env.FANDOM_NEWS_PAGE_URL?.trim();
  if (urlRaw) {
    try {
      const u = new URL(urlRaw);
      const match = u.pathname.match(/\/wiki\/(.+)$/);
      if (match) {
        const segment = match[1].replace(/\/+$/, "");
        try {
          return decodeURIComponent(segment).replace(/_/g, " ");
        } catch {
          return segment.replace(/_/g, " ");
        }
      }
    } catch {
      /* fallthrough */
    }
  }

  const t = process.env.FANDOM_NEWS_PAGE?.trim();
  if (t) return t.replace(/_/g, " ");
  return "Новини серверу";
}

/**
 * Fandom не кешуємо на етапі білду: на Vercel статична генерація часто не досягає api.php,
 * і в HTML «запікалась» би лише помилка. Сторінки /wiki та /news — force-dynamic; fetch — no-store.
 */
const fetchInit = () =>
  ({
    cache: "no-store" as const,
    headers: {
      Accept: "application/json",
      "User-Agent":
        "LostChroniclesSite/1.0 (Next.js; public wiki parse; +https://lost-chronicles.fandom.com)",
    },
  }) as const;

/** Slug у URL ↔ назва сторінки для API (пробіли як у slug через _). */
export function fandomTitleFromWikiSlug(slug: string): string {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    /* raw */
  }
  return s.replace(/_/g, " ");
}

/** Повний URL сторінки на Fandom (повний сайт — для кнопки «відкрити оригінал»). */
export function fandomFullPageUrlForTitle(title: string): string {
  const base = getFandomWikiBase();
  const underscored = title.replace(/ /g, "_");
  return `${base}/wiki/${encodeURIComponent(underscored)}`;
}

/**
 * HTML лише тіла статті (без хедерів/футерів Fandom).
 */
export async function fetchFandomPageHtml(
  pageTitle: string
): Promise<{ html: string; title: string } | null> {
  const base = getFandomWikiBase();

  const params = new URLSearchParams({
    action: "parse",
    format: "json",
    formatversion: "2",
    page: pageTitle,
    prop: "text",
    disableeditsection: "1",
  });

  const url = `${base}/api.php?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, fetchInit());
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = (await res.json()) as {
    parse?: { title?: string; text?: string };
    error?: { info?: string };
  };

  if (data.error || !data.parse?.text) return null;

  let html = data.parse.text;
  const title = data.parse.title ?? pageTitle;

  html = html
    .replace(/href="\/uk\/wiki\//g, `href="${base}/wiki/`)
    .replace(/href="\/wiki\//g, `href="${base}/wiki/`)
    .replace(/href="\/uk\/f\//g, `href="${base}/f/`)
    .replace(/href="\/f\//g, `href="${base}/f/`)
    .replace(/src="\/static\//g, `src="${base}/static/`)
    .replace(/srcset="\/static\//g, `srcset="${base}/static/`)
    .replace(/,\s*\/\//g, ", https://")
    .replace(/(src|href|srcset)="\/\//g, '$1="https://');

  html = rewriteFandomImageUrlsToProxy(html);
  html = rewriteFandomWikiLinksToLocal(html, base);
  html = stripBlankTargetFromLocalWikiAnchors(html);

  return { html, title };
}

const SKIP_WIKI_NS = new RegExp(
  "^(special|file|category|user|user talk|template|mediawiki|help|talk|module|project)$",
  "i",
);

/** Усі посилання на сторінки вікі Fandom → /wiki/… на нашому сайті (без переходу на fandom.com). */
function rewriteFandomWikiLinksToLocal(html: string, wikiBase: string): string {
  let origin: string;
  try {
    origin = new URL(wikiBase.replace(/\/+$/, "")).origin;
  } catch {
    return html;
  }
  const esc = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hrefRe = new RegExp(
    `href="${esc}(?:/[a-z]{2}(?:-[a-z]{2})?)?/wiki/([^"]+)"`,
    "gi",
  );
  return html.replace(hrefRe, (full, pathAndHash: string) => {
    const hashIdx = pathAndHash.indexOf("#");
    const pathPart =
      hashIdx >= 0 ? pathAndHash.slice(0, hashIdx) : pathAndHash;
    const hash = hashIdx >= 0 ? pathAndHash.slice(hashIdx) : "";
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathPart.replace(/\+/g, "%20"));
    } catch {
      decoded = pathPart;
    }
    const ns = decoded.split(":")[0]?.trim() ?? "";
    if (SKIP_WIKI_NS.test(ns)) {
      return full;
    }
    return `href="/wiki/${pathPart}${hash}"`;
  });
}

/** Прибираємо target="_blank" у внутрішніх посилань /wiki/, щоб відкривалось на сайті. */
function stripBlankTargetFromLocalWikiAnchors(html: string): string {
  return html.replace(/<a\s+([^>]+)>/gi, (full, attrs) => {
    const isLocal =
      /\shref="\/wiki\//i.test(attrs) || /\shref='\/wiki\//i.test(attrs);
    if (!isLocal) return full;
    const cleaned = attrs
      .replace(/\s*target="_blank"/gi, "")
      .replace(/\s*target='_blank'/gi, "")
      .replace(/\s*rel="noopener\s+noreferrer"/gi, "")
      .replace(/\s*rel='noopener\s+noreferrer'/gi, "")
      .replace(/\s*rel="nofollow\s+noopener\s+noreferrer"/gi, "")
      .replace(/\s*rel='nofollow\s+noopener\s+noreferrer'/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return `<a ${cleaned}>`;
  });
}

/** Підставляє /api/wiki-image щоб CDN не блокував зображення за Referer (до гідратації клієнта). */
function rewriteFandomImageUrlsToProxy(html: string): string {
  const sub = (s: string) =>
    s.replace(
      /(src|data-src)=["'](https:\/\/[^"']+)["']/gi,
      (match, attr: string, url: string) => {
        const clean = decodeWikiImgSrcUrl(url);
        if (!isWikiCdnImageUrl(clean)) return match;
        const proxied = `${WIKI_IMAGE_PROXY_PATH}?url=${encodeURIComponent(clean)}`;
        return `${attr}="${proxied}"`;
      },
    );
  let out = sub(html);
  out = out.replace(
    /srcset=["']([^"']+)["']/gi,
    (full, inner: string) => {
      const parts = inner.split(",").map((p: string) => p.trim());
      const rebuilt = parts
        .map((part) => {
          const [u, ...desc] = part.split(/\s+/);
          if (!u?.startsWith("https://")) return part;
          const clean = decodeWikiImgSrcUrl(u);
          if (!isWikiCdnImageUrl(clean)) return part;
          const proxied = `${WIKI_IMAGE_PROXY_PATH}?url=${encodeURIComponent(clean)}`;
          const rest = desc.join(" ");
          return rest ? `${proxied} ${rest}` : proxied;
        })
        .join(", ");
      return `srcset="${rebuilt}"`;
    },
  );
  return out;
}
