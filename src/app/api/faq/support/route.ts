import { NextResponse } from "next/server";

import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { parseFaqSupportInput, sendFaqSupportToTelegram } from "@/lib/faq-support";
import { getUserPublicById } from "@/lib/proposals-queries";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json(
      { error: "Увійди в акаунт, щоб написати в підтримку." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некоректні дані." }, { status: 400 });
  }

  const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const parsed = parseFaqSupportInput(raw.topic, raw.body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  let username = `id ${userId}`;
  let gameNickname: string | null = null;
  try {
    const user = await getUserPublicById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Акаунт не знайдено. Увійди ще раз." },
        { status: 401 },
      );
    }
    username = user.username;
    gameNickname = user.game_nickname;
  } catch (e) {
    console.error("[faq-support] profile lookup failed:", e);
  }

  try {
    const sent = await sendFaqSupportToTelegram({
      topic: parsed.topic,
      body: parsed.body,
      userId,
      username,
      gameNickname,
    });
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 502 });
    }
  } catch (e) {
    console.error("[faq-support] submit failed:", e);
    return NextResponse.json(
      { error: "Не вдалося надіслати звернення. Спробуй ще раз." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
