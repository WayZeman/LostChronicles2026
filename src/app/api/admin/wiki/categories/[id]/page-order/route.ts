import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireWikiEditorUserId } from "@/lib/wiki-pages";
import { revalidateWikiPublic } from "@/lib/public-content-cache";
import { setCategoryPageOrder } from "@/lib/wiki-structure";

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

    const categoryId = Number((await ctx.params).id);
    if (!Number.isFinite(categoryId) || categoryId < 1) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const body = (await req.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids.map((id) => Number(id))
      : [];
    const saved = await setCategoryPageOrder(categoryId, ids);
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }
    revalidateWikiPublic();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
