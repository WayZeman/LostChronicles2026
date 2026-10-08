import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { isValidSkinPngDataUrl } from "@/lib/minecraft-skin";
import { countSkins, createSkin, listSkins } from "@/lib/skins";

export const dynamic = "force-dynamic";

function serialize(s: Awaited<ReturnType<typeof listSkins>>[number]) {
  return {
    id: s.id,
    title: s.title,
    model_type: s.model_type,
    png_data: s.png_data,
    likes_count: s.likes_count,
    downloads_count: s.downloads_count,
    created_at: s.created_at.toISOString(),
    author_username: s.author_username,
    author_id: s.author_id,
    liked_by_me: s.liked_by_me,
  };
}

export async function GET(req: Request) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ error: "Потрібен вхід" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || "24");
    const offset = Number(url.searchParams.get("offset") || "0");
    const [skins, total] = await Promise.all([
      listSkins({
        limit: Number.isFinite(limit) ? limit : 24,
        offset: Number.isFinite(offset) ? offset : 0,
        viewerUserId: userId,
      }),
      countSkins(),
    ]);
    return NextResponse.json({ skins: skins.map(serialize), total });
  } catch {
    return NextResponse.json(
      { error: "База даних недоступна" },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ error: "Потрібен вхід" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const pngData = typeof b.png_data === "string" ? b.png_data.trim() : "";
  const modelRaw = typeof b.model_type === "string" ? b.model_type : "classic";
  const modelType = modelRaw === "slim" ? "slim" : "classic";

  if (!title || title.length > 80) {
    return NextResponse.json(
      { error: "Назва обовʼязкова (до 80 символів)" },
      { status: 400 },
    );
  }
  if (!isValidSkinPngDataUrl(pngData)) {
    return NextResponse.json(
      { error: "Невірний PNG скіна" },
      { status: 400 },
    );
  }

  try {
    const skin = await createSkin({
      userId,
      title,
      modelType,
      pngData,
    });
    return NextResponse.json({ skin: serialize(skin) }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Помилка збереження";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
