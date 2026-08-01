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
  title: "Магазин підтримки — Lost Chronicles",
  description: "Бонуси за підтримку сервера Lost Chronicles.",
};

export default async function SupportPage() {
  let cards: Awaited<ReturnType<typeof listSupportCards>> = [];
  let blurb = "Обери бонуси, додай у кошик і оформи оплату.";

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
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--mc-text-muted)]">
              Lost Chronicles
            </p>
            <h1 className="lc-hero-title lc-hero-display mt-1 text-balance text-3xl text-[var(--mc-text)] sm:text-4xl">
              Магазин
            </h1>
            {blurb ? (
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--mc-text-muted)]">
                {blurb}
              </p>
            ) : null}
            <Link
              href="/"
              className="mt-3 inline-block text-sm font-semibold text-[var(--mc-net-green)] hover:underline"
            >
              ← На головну
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
