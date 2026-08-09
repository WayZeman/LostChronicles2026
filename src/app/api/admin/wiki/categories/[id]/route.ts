import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireAdminUserId } from "@/lib/site-content";
import {
  deleteWikiCategory,
  getWikiCategoryBySlug,
  getWikiHomeTree,
  updateWikiCategory,
} from "@/lib/wiki-structure";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }
    // resolve via tree slug lookup is awkward; use id via home tree
    const tree = await getWikiHomeTree();
    const cat = tree.sections
      .flatMap((s) => s.categories)
      .find((c) => c.id === id);
    if (!cat) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const detail = await getWikiCategoryBySlug(cat.slug);
    return NextResponse.json({ category: detail });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = Number((await ctx.params).id);
    const body = (await req.json()) as {
      title?: string;
      description?: string;
      slug?: string;
      sort_order?: number;
      section_id?: number;
    };
    const result = await updateWikiCategory(id, body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const tree = await getWikiHomeTree();
    const detail = await getWikiCategoryBySlug(result.category.slug);
    return NextResponse.json({ ok: true, category: detail, tree });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = Number((await ctx.params).id);
    await deleteWikiCategory(id);
    const tree = await getWikiHomeTree();
    return NextResponse.json({ ok: true, tree });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
