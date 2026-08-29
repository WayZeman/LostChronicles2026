import type { Metadata } from "next";

import { SoftAppear } from "@/components/site/SoftAppear";
import { DiamondPageRoot, DiamondSlot } from "@/components/site/DiamondSlot";
import { lcPageContainerClass, lcPageMainClass } from "@/components/site/lc-page-shell";
import { SupportOrderCards } from "@/components/support/SupportOrderCards";
import { SupportSupportersSection } from "@/components/support/SupportSupportersSection";
import {
  getSupportSettings,
  listSupportCards,
} from "@/lib/site-content";
import { listSupportersLeaderboard } from "@/lib/support-orders";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Магазин підтримки — Lost Chronicles",
  description: "Бонуси за підтримку сервера Lost Chronicles.",
};

export default async function SupportPage() {
  let cards: Awaited<ReturnType<typeof listSupportCards>> = [];
  let blurb = "Обери бонуси, додай у кошик і оформи оплату.";
  let leaderboard: Awaited<ReturnType<typeof listSupportersLeaderboard>> = [];

  try {
    const [list, support] = await Promise.all([
      listSupportCards(),
      getSupportSettings(),
    ]);
    cards = list;
    if (
      support.blurb.trim() &&
      support.blurb.trim() !==
        "Голос у каталогах або донат — обидва варіанти допомагають."
    ) {
      blurb = support.blurb.trim();
    }
  } catch {
    /* empty / fallback */
  }

  try {
    leaderboard = await listSupportersLeaderboard();
  } catch {
    /* рейтинг опційний */
  }

  return (
    <main className={lcPageMainClass}>
      <DiamondPageRoot className={cn(lcPageContainerClass, "pb-24 sm:pb-28")}>
        <SoftAppear>
          <header className="relative mb-6 text-center sm:mb-8">
            <DiamondSlot
              id="support-header"
              className="!absolute !right-2 !top-0 !size-8 sm:!right-6"
            />
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

        {/* Якщо карток менше 8 — запасні якорі, щоб усі 100 діамантів лишались збиральними */}
        {cards.length < 8 ? (
          <div className="relative mb-4 min-h-[2.5rem]" aria-hidden>
            {Array.from({ length: 8 - cards.length }, (_, i) => {
              const index = cards.length + i;
              return (
                <DiamondSlot
                  key={`support-card-fallback-${index}`}
                  id={`support-card-${index}`}
                  className="!absolute !size-8"
                  style={{
                    top: "20%",
                    left: `${10 + i * 12}%`,
                  }}
                />
              );
            })}
          </div>
        ) : null}

        <div className="relative">
          <DiamondSlot
            id="support-supporters"
            className="!absolute !right-3 !top-3 !z-10 !size-8"
          />
          <SupportSupportersSection entries={leaderboard} />
        </div>
      </DiamondPageRoot>
    </main>
  );
}
