import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  deleteWikiPage,
  getWikiPageBySlug,
  requireWikiEditorUserId,
} from "@/lib/wiki-pages";
import { revalidateWikiPublic } from "@/lib/public-content-cache";
import {
  parseSocialLinks,
  updateWikiPageMeta,
  type WikiSocialLink,
} from "@/lib/wiki-structure";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const page = await getWikiPageBySlug(decodeURIComponent(slug));
    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      page: {
        ...page,
        social_links: parseSocialLinks(page.social_links_raw),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const userId = await requireWikiEditorUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { slug: rawSlug } = await ctx.params;
    const slug = decodeURIComponent(rawSlug);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as {
      title?: unknown;
      content_html?: unknown;
      summary?: unknown;
      social_links?: unknown;
    };
    const existing = await getWikiPageBySlug(slug);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const social_links: WikiSocialLink[] | undefined = Array.isArray(
      b.social_links,
    )
      ? parseSocialLinks(JSON.stringify(b.social_links))
      : undefined;

    const result = await updateWikiPageMeta(slug, {
      title: b.title !== undefined ? String(b.title) : undefined,
      content_html:
        b.content_html !== undefined ? String(b.content_html) : undefined,
      summary: b.summary !== undefined ? String(b.summary) : undefined,
      social_links,
      userId,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    revalidateWikiPublic();
    return NextResponse.json({
      ok: true,
      page: {
        ...result.page,
        social_links: parseSocialLinks(result.page.social_links_raw),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const userId = await requireWikiEditorUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { slug: rawSlug } = await ctx.params;
    const slug = decodeURIComponent(rawSlug);
    const result = await deleteWikiPage(slug);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    revalidateWikiPublic();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
