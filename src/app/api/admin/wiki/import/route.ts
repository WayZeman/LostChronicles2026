import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireAdminUserId } from "@/lib/site-content";
import { countWikiPages } from "@/lib/wiki-pages";
import { importWikiFromFandom } from "@/lib/wiki-import";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Одноразовий (або повторний) імпорт статей з Fandom у Neon.
 * Лише адмін. Після імпорту сайт читає вікі з БД.
 */
export async function POST(req: Request) {
  try {
    const adminId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let force = false;
    try {
      const body = (await req.json()) as { force?: unknown };
      force = Boolean(body.force);
    } catch {
      /* empty body ok */
    }

    const existing = await countWikiPages();
    if (existing > 0 && !force) {
      return NextResponse.json(
        {
          error:
            "Вікі вже містить сторінки. Передайте { \"force\": true }, щоб перезаписати з Fandom.",
          count: existing,
        },
        { status: 409 },
      );
    }

    const result = await importWikiFromFandom();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Import failed",
      },
      { status: 503 },
    );
  }
}

export async function GET() {
  try {
    const adminId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const count = await countWikiPages();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
