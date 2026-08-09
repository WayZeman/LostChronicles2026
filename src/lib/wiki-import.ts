import {
  fetchFandomPageHtml,
  getFandomWikiBase,
  fandomTitleFromWikiSlug,
} from "@/lib/fandom";
import {
  importWikiPageSeed,
  wikiSlugFromTitle,
  type WikiPageRecord,
} from "@/lib/wiki-pages";

type AllPagesItem = { title?: string };

const fetchInit = () =>
  ({
    cache: "no-store" as const,
    headers: {
      Accept: "application/json",
      "User-Agent":
        "LostChroniclesSite/1.0 (one-time wiki import; +https://lost-chronicles.com)",
    },
  }) as const;

async function listAllMainPages(): Promise<string[]> {
  const base = getFandomWikiBase();
  const titles: string[] = [];
  let apcontinue: string | undefined;

  for (let i = 0; i < 20; i++) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      list: "allpages",
      apnamespace: "0",
      aplimit: "500",
      formatversion: "2",
    });
    if (apcontinue) params.set("apcontinue", apcontinue);

    const res = await fetch(`${base}/api.php?${params.toString()}`, fetchInit());
    if (!res.ok) break;
    const data = (await res.json()) as {
      query?: { allpages?: AllPagesItem[] };
      continue?: { apcontinue?: string };
    };
    for (const item of data.query?.allpages ?? []) {
      const t = String(item.title ?? "").trim();
      if (t) titles.push(t);
    }
    apcontinue = data.continue?.apcontinue;
    if (!apcontinue) break;
  }

  if (!titles.some((t) => t.toLowerCase() === "main page")) {
    titles.unshift("Main Page");
  }
  return titles;
}

export type WikiImportResult = {
  total: number;
  inserted: number;
  updated: number;
  failed: number;
  failures: { title: string; reason: string }[];
};

/**
 * Одноразовий імпорт з Fandom MediaWiki API → Neon.
 * Після успіху сайт читає лише БД; Fandom більше не потрібен для читання.
 */
export async function importWikiFromFandom(): Promise<WikiImportResult> {
  const titles = await listAllMainPages();
  const result: WikiImportResult = {
    total: titles.length,
    inserted: 0,
    updated: 0,
    failed: 0,
    failures: [],
  };

  for (const title of titles) {
    try {
      const parsed = await fetchFandomPageHtml(title);
      if (!parsed) {
        result.failed += 1;
        result.failures.push({ title, reason: "parse failed" });
        continue;
      }
      const slug = wikiSlugFromTitle(parsed.title || title);
      const status = await importWikiPageSeed({
        slug,
        title: parsed.title || title,
        content_html: parsed.html,
      });
      if (status === "inserted") result.inserted += 1;
      else if (status === "updated") result.updated += 1;
    } catch (e) {
      result.failed += 1;
      result.failures.push({
        title,
        reason: e instanceof Error ? e.message : "error",
      });
    }
  }

  return result;
}

/** Хелпер для відладки slug ↔ title (залишаємо з fandom helpers). */
export function debugTitleFromSlug(slug: string): string {
  return fandomTitleFromWikiSlug(slug);
}

export type { WikiPageRecord };
