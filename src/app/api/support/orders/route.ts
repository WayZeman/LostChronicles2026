import { NextResponse } from "next/server";

import { notifySupportOrderCreatedTelegram } from "@/lib/notify-support-order";
import { getSupportSettings } from "@/lib/site-content";
import {
  buildMonoJarPayUrl,
  createSupportCheckout,
  markOrdersNotified,
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
  const nickname = typeof b.nickname === "string" ? b.nickname : "";
  const note = typeof b.note === "string" ? b.note : "";

  // Новий формат: items[]; старий: cardId + quantity
  let items: { cardId: number; quantity?: number }[] = [];
  if (Array.isArray(b.items)) {
    for (const raw of b.items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const cardId = Number(o.cardId);
      if (!Number.isInteger(cardId) || cardId < 1) continue;
      items.push({
        cardId,
        quantity:
          typeof o.quantity === "number" ? o.quantity : Number(o.quantity),
      });
    }
  } else {
    const cardId = Number(b.cardId);
    if (Number.isInteger(cardId) && cardId >= 1) {
      items = [
        {
          cardId,
          quantity:
            typeof b.quantity === "number" ? b.quantity : Number(b.quantity),
        },
      ];
    }
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "Кошик порожній" }, { status: 400 });
  }

  try {
    const order = await createSupportCheckout({ nickname, note, items });
    const support = await getSupportSettings();
    const jar =
      support.monoJarUrl.trim() ||
      process.env.NEXT_PUBLIC_MONO_JAR_URL?.trim() ||
      "https://send.monobank.ua/jar/8f7nV8DopG";
    const payUrl = buildMonoJarPayUrl(jar, order.amount_kopecks);

    const notified = await notifySupportOrderCreatedTelegram(order);
    if (notified) {
      await markOrdersNotified([order.id]);
    }

    return NextResponse.json({
      ok: true,
      notified,
      order: {
        id: order.id,
        title: order.card_title,
        priceLabel: order.price_label,
        quantity: order.quantity,
        nickname: order.nickname,
        amountKopecks: order.amount_kopecks,
        items: order.items,
      },
      payUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Помилка створення замовлення";
    const status =
      msg.includes("не знайдено") ||
      msg.includes("ціну") ||
      msg.includes("нік") ||
      msg.includes("кількість") ||
      msg.includes("Кошик") ||
      msg.includes("картк")
        ? 400
        : 503;
    return NextResponse.json({ error: msg }, { status });
  }
}
