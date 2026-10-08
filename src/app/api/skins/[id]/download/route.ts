import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { recordSkinDownload } from "@/lib/skins";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Дозволяє пробіли/переноси в base64 (як у validateMinecraftSkinDataUrl). */
const DATA_URL_RE = /^data:image\/png;base64,([A-Za-z0-9+/=\s]+)$/i;

function asciiFilename(title: string): string {
  const ascii = title
    .normalize("NFKD")
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .slice(0, 40)
    .replace(/\s+/g, "-");
  return ascii || "skin";
}

export async function GET(_req: Request, ctx: Ctx) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ error: "Потрібен вхід" }, { status: 401 });
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Невірний id" }, { status: 400 });
  }

  try {
    const skin = await recordSkinDownload(id);
    if (!skin) {
      return NextResponse.json({ error: "Скін не знайдено" }, { status: 404 });
    }
    const m = skin.png_data.trim().match(DATA_URL_RE);
    if (!m) {
      return NextResponse.json({ error: "Пошкоджений файл" }, { status: 500 });
    }
    const buffer = Buffer.from(m[1]!.replace(/\s+/g, ""), "base64");
    const safeName = asciiFilename(skin.title);
    const utfName = encodeURIComponent(
      `${skin.title.trim().slice(0, 60) || "skin"}.png`,
    );
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${safeName}.png"; filename*=UTF-8''${utfName}`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "База даних недоступна" },
      { status: 503 },
    );
  }
}
