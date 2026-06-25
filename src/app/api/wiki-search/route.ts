import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { fandomFullPageUrlForTitle, getFandomWikiBase } from "@/lib/fandom";

type MediaWikiSearchItem = {
  title?: string;
  snippet?: string;
};

function titleToWikiSlug(title: string): string {
  return title.replace(/ /g, "_");
}

function stripHtmlSnippet(snippet: string): string {
  return snippet
    .replace(/<span[^>]*class="searchmatch"[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

let tableEnsured = false;

async function ensureWikiSearchTable() {
  if (tableEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS wiki_search_queries (
      normalized_query TEXT PRIMARY KEY,
      display_query TEXT NOT NULL,
      search_count INTEGER NOT NULL DEFAULT 1,
      last_searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  tableEnsured = true;
}

async function getPopularQueries(limit: number): Promise<string[]> {
  try {
    await ensureWikiSearchTable();
    const sql = getSql();
    const rows = (await sql`
      SELECT display_query AS query
      FROM wiki_search_queries
      WHERE char_length(trim(display_query)) >= 2
      ORDER BY search_count DESC, last_searched_at DESC
      LIMIT ${limit}
    `) as Array<{ query?: string }>;

    return rows
      .map((row) => String(row.query ?? "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function trackQuery(query: string) {
  try {
    await ensureWikiSearchTable();
    const sql = getSql();
    const normalized = query.trim().toLocaleLowerCase("uk-UA");
    if (normalized.length < 2) return;
    await sql`
      INSERT INTO wiki_search_queries (
        normalized_query,
        display_query,
        search_count,
        last_searched_at
      )
      VALUES (${normalized}, ${query.trim()}, 1, NOW())
      ON CONFLICT (normalized_query) DO UPDATE SET
        display_query = EXCLUDED.display_query,
        search_count = wiki_search_queries.search_count + 1,
        last_searched_at = NOW()
    `;
  } catch {
    /* ignore analytics failures */
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    const popularQueries = await getPopularQueries(5);
    return NextResponse.json({ results: [], popularQueries });
  }

  const base = getFandomWikiBase();
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    srsearch: query,
    srlimit: "8",
    srwhat: "text",
    srprop: "snippet",
    utf8: "1",
    origin: "*",
  });

  try {
    const res = await fetch(`${base}/api.php?${params.toString()}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "LostChroniclesSite/1.0 (wiki search; +https://lost-chronicles.fandom.com)",
      },
    });

    if (!res.ok) {
      const popularQueries = await getPopularQueries(5);
      return NextResponse.json({ results: [], popularQueries }, { status: 200 });
    }

    const data = (await res.json()) as {
      query?: { search?: MediaWikiSearchItem[] };
    };

    const results = (data.query?.search ?? [])
      .filter((item) => item.title)
      .map((item) => {
        const title = String(item.title ?? "");
        return {
          title,
          snippet: stripHtmlSnippet(String(item.snippet ?? "")),
          href: `/wiki/${encodeURIComponent(titleToWikiSlug(title))}`,
          originalUrl: fandomFullPageUrlForTitle(title),
        };
      });

    const popularQueries = await getPopularQueries(5);
    return NextResponse.json({ results, popularQueries });
  } catch {
    const popularQueries = await getPopularQueries(5);
    return NextResponse.json({ results: [], popularQueries }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string };
    const query = body.query?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await trackQuery(query);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
