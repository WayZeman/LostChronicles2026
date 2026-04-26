import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KOPECKS_PER_UAH = 100;

declare global {
  // eslint-disable-next-line no-var
  var __monoJarLastBalanceKopecks: number | undefined;
}

type MonoJar = {
  id: string;
  balance?: number;
};

type ClientInfoResponse = {
  jars?: MonoJar[];
};

function uahFromKopecks(kopecks: number): number {
  return kopecks / KOPECKS_PER_UAH;
}

function formatUah(kopecks: number): string {
  return uahFromKopecks(kopecks).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function GET() {
  const token = process.env.MONO_TOKEN?.trim();
  const jarId = process.env.MONO_JAR_ID?.trim();
  const webhook = process.env.DISCORD_WEBHOOK?.trim();

  if (!token) {
    console.error("[mono-check] MONO_TOKEN is missing");
    return NextResponse.json({ ok: false, error: "MONO_TOKEN not configured" }, { status: 500 });
  }

  if (!jarId) {
    console.error("[mono-check] MONO_JAR_ID is missing");
    return NextResponse.json({ ok: false, error: "MONO_JAR_ID not configured" }, { status: 500 });
  }

  if (!webhook) {
    console.error("[mono-check] DISCORD_WEBHOOK is missing");
  }

  let clientInfo: ClientInfoResponse;
  try {
    const res = await fetch("https://api.monobank.ua/personal/client-info", {
      headers: { "X-Token": token },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[mono-check] Monobank API error:", res.status, await res.text());
      return NextResponse.json({ ok: false, error: "Monobank request failed" }, { status: 502 });
    }

    clientInfo = (await res.json()) as ClientInfoResponse;
  } catch (e) {
    console.error("[mono-check] Monobank fetch failed:", e);
    return NextResponse.json({ ok: false, error: "Monobank fetch failed" }, { status: 502 });
  }

  const jars = clientInfo.jars ?? [];
  const jar = jars.find((j) => j.id === jarId);

  if (!jar) {
    console.error("[mono-check] Jar not found for MONO_JAR_ID:", jarId);
    return NextResponse.json({ ok: false, error: "Jar not found" }, { status: 404 });
  }

  const currentBalanceKopecks =
    typeof jar.balance === "number" && Number.isFinite(jar.balance) ? jar.balance : 0;

  const previousBalanceKopecks = globalThis.__monoJarLastBalanceKopecks;

  const currentBalanceUah = formatUah(currentBalanceKopecks);

  if (
    previousBalanceKopecks !== undefined &&
    currentBalanceKopecks > previousBalanceKopecks &&
    webhook
  ) {
    const differenceKopecks = currentBalanceKopecks - previousBalanceKopecks;
    const differenceUah = formatUah(differenceKopecks);

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
                { name: "💵 Сума:", value: `₴${differenceUah}`, inline: false },
                { name: "📊 Поточний баланс:", value: `₴${currentBalanceUah}`, inline: false },
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
      }
    } catch (e) {
      console.error("[mono-check] Discord webhook request failed:", e);
    }
  } else if (
    previousBalanceKopecks !== undefined &&
    currentBalanceKopecks > previousBalanceKopecks &&
    !webhook
  ) {
    console.error("[mono-check] DISCORD_WEBHOOK is missing; cannot send donation notification");
  }

  globalThis.__monoJarLastBalanceKopecks = currentBalanceKopecks;

  return NextResponse.json({
    ok: true,
    currentBalanceKopecks,
    currentBalanceUah,
    notified:
      previousBalanceKopecks !== undefined &&
      currentBalanceKopecks > previousBalanceKopecks &&
      Boolean(webhook),
  });
}
