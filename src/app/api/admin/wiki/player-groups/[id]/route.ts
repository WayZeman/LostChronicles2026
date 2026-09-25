import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireWikiEditorUserId } from "@/lib/wiki-pages";
import { revalidateWikiPublic } from "@/lib/public-content-cache";
import {
  deleteWikiPlayerGroup,
  getWikiCategoryBySlug,
  listWikiPlayerGroups,
} from "@/lib/wiki-structure";
import { WIKI_PLAYERS_SLUG } from "@/lib/wiki-player-roster";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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
    const removed = await deleteWikiPlayerGroup(id);
    if (!removed.ok) {
      return NextResponse.json({ error: removed.error }, { status: 400 });
    }
    revalidateWikiPublic();
    const groups = await listWikiPlayerGroups();
    const category = await getWikiCategoryBySlug(WIKI_PLAYERS_SLUG);
    return NextResponse.json({ ok: true, groups, category });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
