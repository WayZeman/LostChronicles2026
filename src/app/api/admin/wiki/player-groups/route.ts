import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireWikiEditorUserId } from "@/lib/wiki-pages";
import { revalidateWikiPublic } from "@/lib/public-content-cache";
import {
  createWikiPlayerGroup,
  getWikiCategoryBySlug,
  listWikiPlayerGroups,
} from "@/lib/wiki-structure";
import { WIKI_PLAYERS_SLUG } from "@/lib/wiki-player-roster";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireWikiEditorUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const groups = await listWikiPlayerGroups();
    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
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
    const body = (await req.json()) as { title?: string };
    const created = await createWikiPlayerGroup(String(body.title ?? ""));
    if (!created.ok) {
      return NextResponse.json({ error: created.error }, { status: 400 });
    }
    revalidateWikiPublic();
    const groups = await listWikiPlayerGroups();
    const category = await getWikiCategoryBySlug(WIKI_PLAYERS_SLUG);
    return NextResponse.json({ ok: true, group: created.group, groups, category });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
