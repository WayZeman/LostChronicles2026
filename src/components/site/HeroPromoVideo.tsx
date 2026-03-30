"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { lcGlassPanelClass } from "@/components/site/lc-glass-panel";
import { cn } from "@/lib/utils";

const PROMO_VIDEO_ID = "OQpRfs5GKyk";

/** Прев’ю YouTube без iframe, поки користувач не натисне — економія трафіку на мобільних і 3G. */
export function HeroPromoVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="w-full" aria-label="Відео про сервер Lost Chronicles на YouTube">
      <div
        className={cn(
          lcGlassPanelClass,
          "overflow-hidden !p-0 bg-black/38 shadow-[0_8px_36px_rgba(0,0,0,0.34)]",
        )}
      >
        <div className="relative aspect-video w-full bg-black/20">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${PROMO_VIDEO_ID}?autoplay=1&rel=0`}
              className="absolute inset-0 h-full w-full border-0"
              title="Lost Chronicles — відео на YouTube"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <>
              <Image
                src={`https://i.ytimg.com/vi/${PROMO_VIDEO_ID}/hqdefault.jpg`}
                alt=""
                className="object-cover"
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                loading="lazy"
                fetchPriority="low"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
                aria-hidden
              />
              <button
                type="button"
                className="lc-focus-ring absolute inset-0 flex flex-col items-center justify-center gap-3 text-white transition-opacity hover:opacity-95 active:opacity-90"
                onClick={() => setPlaying(true)}
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-[var(--mc-net-green)] text-[var(--mc-on-gold)] shadow-lg md:size-[4.25rem]">
                  <Play className="ml-1 size-8 md:size-9" fill="currentColor" aria-hidden />
                </span>
                <span className="px-4 text-center text-sm font-bold drop-shadow md:text-base">
                  Відтворити відео (YouTube)
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
