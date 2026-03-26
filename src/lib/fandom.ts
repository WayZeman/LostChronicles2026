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

  return { html, title };
}
