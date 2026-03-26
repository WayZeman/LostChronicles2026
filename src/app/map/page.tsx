import { ExternalLink, Map as MapIcon } from "lucide-react";

import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

/** BlueMap; перевизначення: NEXT_PUBLIC_MAP_URL у .env (у лапках, якщо є # у hash) */
const DEFAULT_MAP_URL =
  "http://142.132.211.240:25553/#world:0:0:0:1500:0:0:0:1:flat";

export default function MapPage() {
  const mapUrl = process.env.NEXT_PUBLIC_MAP_URL?.trim() || DEFAULT_MAP_URL;

  return (
    <main className="relative flex min-h-0 flex-1 flex-col bg-[var(--mc-surface-elevated)]">
      <div
        className={cn(
          "flex w-full flex-1 flex-col items-center justify-center gap-6 px-4 py-10",
          "min-h-[min(100dvh-11rem,720px)] sm:min-h-[min(100dvh-12rem,800px)]",
        )}
      >
        <div
          className={cn(
            lcGlassPanelClass,
            "flex max-w-md flex-col items-center gap-5 text-center",
          )}
        >
          <div className="flex size-16 items-center justify-center rounded-sm border border-[var(--mc-border)] bg-[var(--mc-surface-elevated)] text-[var(--mc-net-green)]">
            <MapIcon className="size-8" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-[var(--mc-text)] md:text-xl">
              Інтерактивна мапа світу
            </h1>
            <p className="text-sm font-medium text-[var(--mc-text-subtle)]">
              Карта на базі BlueMap відкриється в новій вкладці браузера.
            </p>
          </div>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-focus-ring inline-flex items-center gap-2 rounded-sm border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-6 py-3 text-sm font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)]"
          >
            Відкрити карту
            <ExternalLink className="size-4 opacity-90" aria-hidden />
          </a>
        </div>
      </div>
    </main>
  );
}
