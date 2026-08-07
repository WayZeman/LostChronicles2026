import { NextResponse } from "next/server";

import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { notifySupportOrderCreatedTelegram } from "@/lib/notify-support-order";
import { getUserPublicById } from "@/lib/proposals-queries";
import { getSupportSettings } from "@/lib/site-content";
import {
  buildMonoJarPayUrl,
  createSupportDonation,
  markOrdersNotified,
  parseDonationUahToKopecks,
} from "@/lib/support-orders";

export const dynamic = "force-dynamic";

/**
 * Проста підтримка: авторизований гравець вказує суму → pending + банка з ?a=.
 */
export async function POST(req: Request) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json(
      { error: "Увійди в акаунт, щоб підтримати сервер." },
      { status: 401 },
    );
  }

  const user = await getUserPublicById(userId);
  const nickname = user?.game_nickname?.trim() || "";
  if (!nickname) {
    return NextResponse.json(
      { error: "Спочатку вкажи Minecraft-нік у профілі." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const amountKopecks =
    parseDonationUahToKopecks(b.amountUah) ??
    (typeof b.amountKopecks === "number" && Number.isFinite(b.amountKopecks)
      ? Math.round(b.amountKopecks)
      : null);

  if (amountKopecks == null) {
    return NextResponse.json(
      { error: "Вкажи суму від 1 до 500 000 ₴." },
      { status: 400 },
    );
  }

  const note = typeof b.note === "string" ? b.note : "";

  try {
    const order = await createSupportDonation({
      nickname,
      amountKopecks,
      note,
    });
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
        nickname: order.nickname,
        amountKopecks: order.amount_kopecks,
      },
      payUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Помилка створення донату";
    const status =
      msg.includes("нік") || msg.includes("Сума") || msg.includes("Вкажи")
        ? 400
        : 503;
    return NextResponse.json({ error: msg }, { status });
  }
}
