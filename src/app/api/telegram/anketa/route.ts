import { NextResponse } from "next/server";

import {
  handleAnketaBotUpdate,
  setupAnketaTelegramWebhook,
} from "@/lib/anketa-telegram-bot";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

export const dynamic = "force-dynamic";

function expectedSecret(): string {
  return (
    process.env.TELEGRAM_ANKETA_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

/** POST = Telegram webhook. У production секрет обовʼязковий. */
export async function POST(req: Request) {
  const expected = expectedSecret();
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
  } else {
    const got = req.headers.get("x-telegram-bot-api-secret-token") || "";
    if (got !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleAnketaBotUpdate(update);
  } catch (e) {
    console.error("[anketa-bot] handle failed:", e);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Підключити webhook після вимкнення Google Apps Script polling:
 * GET /api/telegram/anketa?setup=1&secret=CRON_SECRET
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("setup") !== "1") {
    return NextResponse.json({
      ok: true,
      hint: "POST = Telegram webhook. Setup: ?setup=1&secret=…",
    });
  }

  const secret = url.searchParams.get("secret") || "";
  const expected = expectedSecret();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || getLcMarketingSiteUrl();
  const webhookUrl = `${base.replace(/\/$/, "")}/api/telegram/anketa`;
  const result = await setupAnketaTelegramWebhook(webhookUrl);
  return NextResponse.json({
    ...result,
    webhookUrl,
  });
}
