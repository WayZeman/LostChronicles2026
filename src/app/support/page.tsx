import type { Metadata } from "next";
import Link from "next/link";

import { SoftAppear } from "@/components/site/SoftAppear";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { SupportOrderCards } from "@/components/support/SupportOrderCards";
import {
  getSupportSettings,
  listSupportCards,
} from "@/lib/site-content";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Підтримка — Lost Chronicles",
  description: "Підтримай сервер Lost Chronicles: бонуси за донат.",
};

export default async function SupportPage() {
  let cards: Awaited<ReturnType<typeof listSupportCards>> = [];
  let blurb =
    "Обери пропозицію, вкажи нік і натисни оплатити — адміни одразу отримають замовлення в Telegram.";

  try {
    const [list, support] = await Promise.all([
      listSupportCards(),
      getSupportSettings(),
    ]);
    cards = list;
    // Не показуємо старий маркетинговий blurb з головної
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

  return (
    <main className={lcPageMainClass}>
      <div
        className={cn(
          "site-container relative z-10 mx-auto w-full max-w-4xl",
          "px-[max(0.75rem,env(safe-area-inset-left,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-6",
          "pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:px-4 sm:pb-12 sm:pt-10 md:py-14",
        )}
      >
        <SoftAppear>
          <header className="mb-8 text-center sm:mb-10">
            <h1 className="lc-hero-title lc-hero-display text-balance text-3xl text-[var(--mc-text)] sm:text-4xl">
              Підтримка
            </h1>
            {blurb ? (
              <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--mc-text-muted)] sm:text-[0.9375rem]">
                {blurb}
              </p>
            ) : null}
            <Link
              href="/faq"
              className="mt-3 inline-block text-sm font-semibold text-[var(--mc-net-green)] hover:underline"
            >
              ← До FAQ
            </Link>
          </header>
        </SoftAppear>

        <SupportOrderCards
          cards={cards.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            image_url: c.image_url,
            price_label: c.price_label,
            quantity_enabled: c.quantity_enabled,
          }))}
        />
      </div>
    </main>
  );
}
