import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron-auth";
import {
  notifySupportOrderPaidTelegram,
  notifyUnmatchedDonationTelegram,
} from "@/lib/notify-support-order";
import {
  getStoredMonoBalanceKopecks,
  markOrdersNotified,
  matchPendingOrdersByPayment,
  setStoredMonoBalanceKopecks,
} from "@/lib/support-orders";

export const dynamic = "force-dynamic";

const KOPECKS_PER_UAH = 100;

type MonoJar = {
  id: string;
  balance?: number;
};

type ClientInfoResponse = {
  jars?: MonoJar[];
};

function formatUah(kopecks: number): string {
  return (kopecks / KOPECKS_PER_UAH).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function notifyDiscordDonation(
  differenceKopecks: number,
  currentBalanceKopecks: number,
  webhook: string,
): Promise<boolean> {
  try {
    const discordRes = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "💛 Отримано підтримку!",
            color: 0xf1c40f,
            fields: [
              {
                name: "💵 Сума:",
                value: `₴${formatUah(differenceKopecks)}`,
                inline: false,
              },
              {
                name: "📊 Поточний баланс:",
                value: `₴${formatUah(currentBalanceKopecks)}`,
                inline: false,
              },
            ],
            footer: { text: "Lost Chronicle Support" },
          },
        ],
      }),
    });
    if (!discordRes.ok) {
      console.error(
        "[mono-check] Discord webhook error:",
        discordRes.status,
        await discordRes.text(),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error("[mono-check] Discord webhook request failed:", e);
    return false;
  }
}

/**
 * Перевірка балансу банки Monobank:
 * зіставляє приріст з pending-замовленнями /support і шле в Telegram (@serveranketbot).
 */
export async function GET(req: Request) {
  const denied = authorizeCronRequest(req);
  if (denied) return denied;

  const token = process.env.MONO_TOKEN?.trim();
  const jarId = process.env.MONO_JAR_ID?.trim();
  const webhook = process.env.DISCORD_WEBHOOK?.trim();

  if (!token) {
    console.error("[mono-check] MONO_TOKEN is missing");
    return NextResponse.json(
      { ok: false, error: "MONO_TOKEN not configured" },
      { status: 500 },
    );
  }

  if (!jarId) {
    console.error("[mono-check] MONO_JAR_ID is missing");
    return NextResponse.json(
      { ok: false, error: "MONO_JAR_ID not configured" },
      { status: 500 },
    );
  }

  let clientInfo: ClientInfoResponse;
  try {
    const res = await fetch("https://api.monobank.ua/personal/client-info", {
      headers: { "X-Token": token },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        "[mono-check] Monobank API error:",
        res.status,
        await res.text(),
      );
      return NextResponse.json(
        { ok: false, error: "Monobank request failed" },
        { status: 502 },
      );
    }

    clientInfo = (await res.json()) as ClientInfoResponse;
  } catch (e) {
    console.error("[mono-check] Monobank fetch failed:", e);
    return NextResponse.json(
      { ok: false, error: "Monobank fetch failed" },
      { status: 502 },
    );
  }

  const jars = clientInfo.jars ?? [];
  const jar = jars.find((j) => j.id === jarId);

  if (!jar) {
    console.error("[mono-check] Jar not found for MONO_JAR_ID:", jarId);
    return NextResponse.json({ ok: false, error: "Jar not found" }, { status: 404 });
  }

  const currentBalanceKopecks =
    typeof jar.balance === "number" && Number.isFinite(jar.balance)
      ? Math.round(jar.balance)
      : 0;

  let previousBalanceKopecks: number | null = null;
  try {
    previousBalanceKopecks = await getStoredMonoBalanceKopecks();
  } catch (e) {
    console.error("[mono-check] Failed to read stored balance:", e);
  }

  let matchedCount = 0;
  let telegramOk = false;
  let discordOk = false;
  let differenceKopecks = 0;

  if (
    previousBalanceKopecks !== null &&
    currentBalanceKopecks > previousBalanceKopecks
  ) {
    differenceKopecks = currentBalanceKopecks - previousBalanceKopecks;

    try {
      const matched = await matchPendingOrdersByPayment(differenceKopecks);
      matchedCount = matched.length;

      if (matched.length > 0) {
        const results = await Promise.all(
          matched.map((o) => notifySupportOrderPaidTelegram(o)),
        );
        telegramOk = results.every(Boolean);
        if (telegramOk) {
          await markOrdersNotified(matched.map((o) => o.id));
        }
      } else {
        telegramOk = await notifyUnmatchedDonationTelegram(differenceKopecks);
      }
    } catch (e) {
      console.error("[mono-check] Order match / Telegram failed:", e);
    }

    if (webhook) {
      discordOk = await notifyDiscordDonation(
        differenceKopecks,
        currentBalanceKopecks,
        webhook,
      );
    }
  }

  try {
    await setStoredMonoBalanceKopecks(currentBalanceKopecks);
  } catch (e) {
    console.error("[mono-check] Failed to store balance:", e);
  }

  return NextResponse.json({
    ok: true,
    currentBalanceKopecks,
    currentBalanceUah: formatUah(currentBalanceKopecks),
    previousBalanceKopecks,
    differenceKopecks:
      previousBalanceKopecks !== null &&
      currentBalanceKopecks > previousBalanceKopecks
        ? differenceKopecks
        : 0,
    matchedOrders: matchedCount,
    notifiedTelegram: telegramOk,
    notifiedDiscord: discordOk,
  });
}
