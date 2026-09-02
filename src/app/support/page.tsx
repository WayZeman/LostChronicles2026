import type { Metadata } from "next";

import { SoftAppear } from "@/components/site/SoftAppear";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { SupportOrderCards } from "@/components/support/SupportOrderCards";
import { SupportSupportersSection } from "@/components/support/SupportSupportersSection";
import {
  getSupportSettings,
  listSupportCards,
} from "@/lib/site-content";
import { listSupportersLeaderboard } from "@/lib/support-orders";
import { cn } from "@/lib/utils";

import { buildLcPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildLcPageMetadata({
  title: "Магазин підтримки Lost Chronicles — бонуси Minecraft",
  description:
    "Підтримай український Minecraft-сервер Lost Chronicles і отримай ігрові бонуси. Оплата через Monobank.",
  path: "/support",
});

export default async function SupportPage() {
  let cards: Awaited<ReturnType<typeof listSupportCards>> = [];
  let blurb = "Обери бонуси, додай у кошик і оформи оплату.";
  let leaderboard: Awaited<ReturnType<typeof listSupportersLeaderboard>> = [];

  try {
    cards = await listSupportCards();
  } catch (e) {
    console.error("[support] listSupportCards failed", e);
  }

  try {
    const support = await getSupportSettings();
    if (
      support.blurb.trim() &&
      support.blurb.trim() !==
        "Голос у каталогах або донат — обидва варіанти допомагають."
    ) {
      blurb = support.blurb.trim();
    }
  } catch (e) {
    console.error("[support] getSupportSettings failed", e);
  }

  try {
    leaderboard = await listSupportersLeaderboard();
  } catch (e) {
    console.error("[support] listSupportersLeaderboard failed", e);
  }

  return (
    <main className={lcPageMainClass}>
      <div className={cn(lcPageContainerClass, "pb-24 sm:pb-28")}>
        <SoftAppear>
          <header className="relative mb-6 text-center sm:mb-8">
            <h1 className="lc-hero-title lc-hero-display text-balance text-3xl text-[var(--mc-text)] sm:text-4xl">
              Магазин
            </h1>
            {blurb ? (
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--mc-text-muted)]">
                {blurb}
              </p>
            ) : null}
          </header>
        </SoftAppear>

        <SupportOrderCards
          cards={cards.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            image_url: c.image_url,
            price_label: c.price_label,
            price_tiers: c.price_tiers,
            quantity_enabled: c.quantity_enabled,
          }))}
        />

        <SupportSupportersSection entries={leaderboard} />
      </div>
    </main>
  );
}
