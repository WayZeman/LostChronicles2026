import type { Metadata } from "next";
import { ExternalLink, Map as MapIcon } from "lucide-react";

import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";

/** BlueMap. Перевизначення: NEXT_PUBLIC_MAP_URL у .env / Vercel (у лапках, якщо є # у hash). */
const DEFAULT_MAP_URL =
  "http://142.132.211.240:25553/#world:0:0:0:1500:0:0:0:1:flat";

export const metadata: Metadata = {
  title: "Мапа — Lost Chronicles",
  description: "Інтерактивна мапа світу сервера (BlueMap).",
};

export default function MapPage() {
  const mapUrl = process.env.NEXT_PUBLIC_MAP_URL?.trim() || DEFAULT_MAP_URL;

  return (
    <main className="relative flex min-h-0 flex-1 flex-col justify-center">
      <div className="site-container mx-auto w-full max-w-4xl px-4 py-10 md:py-16">
        <div
          className={`${lcGlassPanelClass} flex flex-col items-center text-center`}
        >
          <h2 className="lc-hero-title text-xl font-extrabold text-[var(--mc-text)] md:text-2xl">
            Перейти до карти
          </h2>
          <p className="mt-4 w-full max-w-lg text-sm font-medium leading-relaxed text-[var(--mc-text-muted)] md:text-base">
            Натисніть кнопку нижче, щоб відкрити мапу сервера. Якщо вікно не відкривається,
            перевірте блокувальник спливаючих вікон.
          </p>
          <div className="mt-8 md:mt-10">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lc-focus-ring inline-flex items-center gap-2 rounded-sm border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-5 py-2.5 text-sm font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)] md:px-6 md:py-3"
            >
              <MapIcon className="size-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
              Мапа серверу
              <ExternalLink className="size-3 opacity-60" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
