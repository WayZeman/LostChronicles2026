"use client";

import { useEffect, useMemo, useState } from "react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { buildAndroidDiscordOAuthIntent } from "@/lib/discord-mobile-launch";
import { cn } from "@/lib/utils";

export function DiscordMobileLaunch({
  authorizeUrl,
}: {
  authorizeUrl: string;
}) {
  const [isAndroid, setIsAndroid] = useState(false);
  const androidIntent = useMemo(
    () => buildAndroidDiscordOAuthIntent(authorizeUrl),
    [authorizeUrl],
  );

  useEffect(() => {
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!isAndroid) return;
    const id = window.setTimeout(() => {
      window.location.href = androidIntent;
    }, 400);
    return () => window.clearTimeout(id);
  }, [androidIntent, isAndroid]);

  const primaryHref = isAndroid ? androidIntent : authorizeUrl;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
      <div
        className={cn(
          lcGlassPanelClass,
          "w-full max-w-md space-y-4 text-center !p-6",
        )}
      >
        <h1 className="text-lg font-extrabold text-[var(--mc-text)]">
          Вхід через Discord
        </h1>
        <p className="text-sm leading-relaxed text-[var(--mc-text-muted)]">
          {isAndroid
            ? "Зараз відкриється застосунок Discord. Якщо цього не сталося — натисни кнопку."
            : "Натисни кнопку, щоб відкрити Discord. Якщо з’явиться запитання «Відкрити в застосунку» — обери застосунок Discord."}
        </p>
        <a
          href={primaryHref}
          className="lc-focus-ring inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg border-2 border-[#5865F2] bg-[#5865F2]/25 px-4 py-3 text-sm font-bold text-[var(--mc-text)] active:scale-[0.99]"
        >
          {isAndroid ? "Відкрити в застосунку Discord" : "Продовжити в Discord"}
        </a>
        <a
          href={authorizeUrl}
          className="block text-center text-xs font-semibold text-[var(--mc-net-green)] underline-offset-2 hover:underline"
        >
          Звичайний вхід у браузері
        </a>
      </div>
    </div>
  );
}
