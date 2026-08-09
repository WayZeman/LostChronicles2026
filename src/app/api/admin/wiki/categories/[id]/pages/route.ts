import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireAdminUserId } from "@/lib/site-content";
import {
  addPageToCategory,
  getWikiCategoryBySlug,
  getWikiHomeTree,
  linkExistingPageToCategory,
} from "@/lib/wiki-structure";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categoryId = Number((await ctx.params).id);
    if (!Number.isFinite(categoryId) || categoryId < 1) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const body = (await req.json()) as {
      mode?: "create" | "link";
      title?: string;
      slug?: string;
      short_code?: string;
      card_blurb?: string;
      content_html?: string;
      page_id?: number;
    };

    if (body.mode === "link") {
      const pageId = Number(body.page_id);
      if (!Number.isFinite(pageId)) {
        return NextResponse.json({ error: "Потрібен page_id." }, { status: 400 });
      }
      const linked = await linkExistingPageToCategory({
        category_id: categoryId,
        page_id: pageId,
        short_code: body.short_code,
        card_blurb: body.card_blurb,
      });
      if (!linked.ok) {
        return NextResponse.json({ error: linked.error }, { status: 400 });
      }
    } else {
      const created = await addPageToCategory({
        category_id: categoryId,
        title: String(body.title ?? ""),
        slug: body.slug,
        short_code: body.short_code,
        card_blurb: body.card_blurb,
        content_html: body.content_html,
        userId,
      });
      if (!created.ok) {
        return NextResponse.json({ error: created.error }, { status: 400 });
      }
    }

    const tree = await getWikiHomeTree();
    const catMeta = tree.sections
      .flatMap((s) => s.categories)
      .find((c) => c.id === categoryId);
    const category = catMeta
      ? await getWikiCategoryBySlug(catMeta.slug)
      : null;
    return NextResponse.json({ ok: true, category, tree });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
