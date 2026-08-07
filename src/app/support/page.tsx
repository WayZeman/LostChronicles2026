import type { Metadata } from "next";

import { SoftAppear } from "@/components/site/SoftAppear";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { SupportOrderCards } from "@/components/support/SupportOrderCards";
import { SupportSupportersSection } from "@/components/support/SupportSupportersSection";
import {
  getSupportSettings,
  listSupportCards,
} from "@/lib/site-content";
import { listPaidSupportersThisMonth } from "@/lib/support-orders";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Магазин підтримки — Lost Chronicles",
  description: "Бонуси за підтримку сервера Lost Chronicles.",
};

export default async function SupportPage() {
  let cards: Awaited<ReturnType<typeof listSupportCards>> = [];
  let blurb = "Обери бонуси, додай у кошик і оформи оплату.";
  let supporterNicks: string[] = [];

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
    supporterNicks = await listPaidSupportersThisMonth();
  } catch {
    /* стрічка опційна */
  }

  return (
    <main className={lcPageMainClass}>
      <div
        className={cn(
          "site-container relative z-10 mx-auto w-full max-w-5xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pb-[max(7rem,env(safe-area-inset-bottom,0px))] pt-5",
          "pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-4 sm:pb-28 sm:pt-8 md:pt-10",
        )}
      >
        <SoftAppear>
          <header className="mb-6 text-center sm:mb-8">
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

        <SupportSupportersSection nicknames={supporterNicks} />
      </div>
    </main>
  );
}
