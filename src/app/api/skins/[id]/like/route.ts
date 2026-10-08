import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { toggleSkinLike } from "@/lib/skins";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
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
    const result = await toggleSkinLike(id, userId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Скін не знайдено" }, { status: 404 });
  }
}
