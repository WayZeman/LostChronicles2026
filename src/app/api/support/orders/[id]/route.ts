import { NextResponse } from "next/server";

import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { getUserPublicById } from "@/lib/proposals-queries";
import { getSupportOrderById } from "@/lib/support-orders";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json(
      { error: "Увійди в акаунт." },
      { status: 401 },
    );
  }

  const user = await getUserPublicById(userId);
  const viewerNick = user?.game_nickname?.trim().toLowerCase() ?? "";
  if (!viewerNick) {
    return NextResponse.json(
      { error: "Спочатку вкажи Minecraft-нік у профілі." },
      { status: 403 },
    );
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Некоректний id" }, { status: 400 });
  }

  try {
    const order = await getSupportOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Не знайдено" }, { status: 404 });
    }
    if (order.nickname.trim().toLowerCase() !== viewerNick) {
      return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }
    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        title: order.card_title,
        priceLabel: order.price_label,
        nickname: order.nickname,
        status: order.status,
      },
    });
  } catch (e) {
    console.error("[support-orders get]", e);
    return NextResponse.json({ error: "DB error" }, { status: 503 });
  }
}
