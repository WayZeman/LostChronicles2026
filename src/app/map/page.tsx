import { Map as MapIcon } from "lucide-react";

import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";
import { MapOpenActions } from "./MapOpenActions";

/**
 * BlueMap. Перевизначення: NEXT_PUBLIC_MAP_URL у .env / Vercel (у лапках, якщо є # у hash).
 * Перехід з HTTPS-сайту на http://IP інколи блокує Squid (cross-site), тоді допомагає «Скопіювати» → вставити в адресний рядок.
 */
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
              Карта на базі BlueMap відкриється в новій вкладці або за скопійованим посиланням.
            </p>
            <p className="text-xs leading-relaxed text-[var(--mc-text-muted)]">
              Якщо кнопка «Відкрити карту» показує помилку проксі (squid / Access Denied), а той самий
              URL у адресному рядку працює — це обмеження мережі на перехід із сайту на{" "}
              <code className="text-[11px]">http://IP</code>. Натисніть «Скопіювати посилання» і
              вставте в браузер, або опублікуйте мапу за HTTPS через домен і вкажіть{" "}
              <code className="rounded bg-[var(--mc-surface-elevated)] px-1 py-0.5 text-[11px]">
                NEXT_PUBLIC_MAP_URL
              </code>
              .
            </p>
          </div>
          <MapOpenActions mapUrl={mapUrl} className="max-w-full" />
        </div>
      </div>
    </main>
  );
}
