import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  listWikiPages,
  requireWikiEditorUserId,
  upsertWikiPage,
  wikiSlugFromTitle,
} from "@/lib/wiki-pages";
import { revalidateWikiPublic } from "@/lib/public-content-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pages = await listWikiPages(500);
    return NextResponse.json({ pages });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable", pages: [] },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireWikiEditorUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as {
      title?: unknown;
      slug?: unknown;
      content_html?: unknown;
    };
    const title = String(b.title ?? "").trim();
    const slugRaw = String(b.slug ?? "").trim();
    const content_html = String(b.content_html ?? "");
    if (!title) {
      return NextResponse.json({ error: "Потрібна назва." }, { status: 400 });
    }

    const result = await upsertWikiPage({
      slug: slugRaw || wikiSlugFromTitle(title),
      title,
      content_html,
      userId,
      createOnly: true,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    revalidateWikiPublic();
    return NextResponse.json({ ok: true, page: result.page });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
