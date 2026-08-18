import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { storeDataUrlAsMedia } from "@/lib/site-media";
import { requireWikiEditorUserId } from "@/lib/wiki-pages";

export const dynamic = "force-dynamic";

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

    const dataUrl =
      typeof (body as { dataUrl?: unknown }).dataUrl === "string"
        ? (body as { dataUrl: string }).dataUrl.trim()
        : "";
    if (!dataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Потрібен data URL зображення." },
        { status: 400 },
      );
    }
    if (dataUrl.length > 1_400_000) {
      return NextResponse.json(
        { error: "Фото занадто велике." },
        { status: 400 },
      );
    }

    try {
      const url = await storeDataUrlAsMedia(dataUrl);
      return NextResponse.json({ url });
    } catch (e) {
      return NextResponse.json(
        {
          error:
            e instanceof Error ? e.message : "Не вдалося зберегти фото.",
        },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
