import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
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
      return NextResponse.json({ results: [] }, { status: 200 });
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

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
