import { NextResponse } from "next/server";

import {
  handleSiteBotUpdate,
  setupTelegramSiteBot,
  siteBotToken,
} from "@/lib/telegram-site-bot";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

export const dynamic = "force-dynamic";

function setupSecretOk(req: Request): boolean {
  const url = new URL(req.url);
  const secret =
    process.env.TELEGRAM_SITE_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  if (!secret) return false;
  const q = url.searchParams.get("secret")?.trim();
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return q === secret || auth === secret;
}

function webhookSecretOk(req: Request): boolean {
  // Лише явний TELEGRAM_SITE_WEBHOOK_SECRET — не CRON_SECRET
  // (інакше Telegram отримує 401, бо secret_token на webhook не виставлений).
  const expected = process.env.TELEGRAM_SITE_WEBHOOK_SECRET?.trim() || "";
  if (!expected) return true;
  const got = req.headers.get("x-telegram-bot-api-secret-token")?.trim();
  return got === expected;
}

/**
 * Webhook бота сайту (@lostchronicles_bot): /start → кнопка Mini App.
 * Setup: GET /api/telegram/site?setup=1&secret=…
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("setup") !== "1") {
    return NextResponse.json({
      ok: true,
      bot: "site",
      hint: "GET ?setup=1&secret=… to configure menu button + webhook",
    });
  }
  if (!setupSecretOk(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!siteBotToken()) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_SITE_BOT_TOKEN missing" },
      { status: 500 },
    );
  }

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || getLcMarketingSiteUrl();
  const webhookUrl = `${base.replace(/\/$/, "")}/api/telegram/site`;
  const result = await setupTelegramSiteBot({ webhookUrl });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(req: Request) {
  if (!webhookSecretOk(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!siteBotToken()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await handleSiteBotUpdate(update);
  } catch (e) {
    console.error("[telegram-site] update failed:", e);
  }
  return NextResponse.json({ ok: true });
}
