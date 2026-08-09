import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireWikiEditorUserId } from "@/lib/wiki-pages";
import { revalidateWikiPublic } from "@/lib/public-content-cache";
import {
  deleteWikiSection,
  getWikiHomeTree,
  updateWikiSection,
} from "@/lib/wiki-structure";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const userId = await requireWikiEditorUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id) || id < 1) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }
    const body = (await req.json()) as {
      title?: string;
      description?: string;
      sort_order?: number;
    };
    const section = await updateWikiSection(id, body);
    if (!section) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    revalidateWikiPublic();
    const tree = await getWikiHomeTree();
    return NextResponse.json({ ok: true, section, tree });
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
    const id = Number((await ctx.params).id);
    if (!Number.isFinite(id) || id < 1) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }
    await deleteWikiSection(id);
    revalidateWikiPublic();
    const tree = await getWikiHomeTree();
    return NextResponse.json({ ok: true, tree });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
