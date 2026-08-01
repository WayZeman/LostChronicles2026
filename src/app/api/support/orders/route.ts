import { NextResponse } from "next/server";

import { getSupportSettings } from "@/lib/site-content";
import {
  buildMonoJarPayUrl,
  createSupportOrder,
} from "@/lib/support-orders";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const cardId = Number(b.cardId);
  const nickname = typeof b.nickname === "string" ? b.nickname : "";
  const note = typeof b.note === "string" ? b.note : "";

  if (!Number.isInteger(cardId) || cardId < 1) {
    return NextResponse.json({ error: "Некоректна картка" }, { status: 400 });
  }

  try {
    const order = await createSupportOrder({ cardId, nickname, note });
    const support = await getSupportSettings();
    const jar =
      support.monoJarUrl.trim() ||
      process.env.NEXT_PUBLIC_MONO_JAR_URL?.trim() ||
      "https://send.monobank.ua/jar/8f7nV8DopG";
    const payUrl = buildMonoJarPayUrl(jar, order.amount_kopecks);

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        title: order.card_title,
        priceLabel: order.price_label,
        nickname: order.nickname,
      },
      payUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Помилка створення замовлення";
    const status =
      msg.includes("не знайдено") || msg.includes("ціну") || msg.includes("нік")
        ? 400
        : 503;
    return NextResponse.json({ error: msg }, { status });
  }
}
