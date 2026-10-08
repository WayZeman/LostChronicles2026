import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { recordSkinDownload } from "@/lib/skins";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const DATA_URL_RE = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/i;

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
    const m = skin.png_data.match(DATA_URL_RE);
    if (!m) {
      return NextResponse.json({ error: "Пошкоджений файл" }, { status: 500 });
    }
    const buffer = Buffer.from(m[1]!, "base64");
    const safeName =
      skin.title
        .replace(/[^\w\u0400-\u04FF\- ]+/g, "")
        .trim()
        .slice(0, 40)
        .replace(/\s+/g, "-") || "skin";
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${safeName}.png"`,
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
