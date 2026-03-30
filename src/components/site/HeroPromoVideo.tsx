"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMO_VIDEO_ID = "OQpRfs5GKyk";

/** Від найкращої якості до запасної (не всі ролики мають maxres на ytimg). */
const THUMB_URLS = [
  `https://i.ytimg.com/vi/${PROMO_VIDEO_ID}/maxresdefault.jpg`,
  `https://i.ytimg.com/vi/${PROMO_VIDEO_ID}/sddefault.jpg`,
  `https://i.ytimg.com/vi/${PROMO_VIDEO_ID}/hqdefault.jpg`,
] as const;

/** Прев’ю YouTube без iframe, поки користувач не натисне — економія трафіку на мобільних і 3G. */
export function HeroPromoVideo() {
  const [playing, setPlaying] = useState(false);
  const [thumbIndex, setThumbIndex] = useState(0);

  return (
    <div className="w-full" aria-label="Відео про сервер Lost Chronicles на YouTube">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-white/[0.09]",
          "bg-[color-mix(in_srgb,var(--mc-net-page)_92%,transparent)]",
          "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
        )}
      >
        <div className="relative aspect-video w-full bg-black">
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
                key={THUMB_URLS[thumbIndex]}
                src={THUMB_URLS[thumbIndex]}
                alt=""
                className="object-cover"
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                quality={92}
                loading="lazy"
                fetchPriority="low"
                onError={() => {
                  setThumbIndex((i) =>
                    i < THUMB_URLS.length - 1 ? i + 1 : i,
                  );
                }}
              />
              <div
                className="absolute inset-0 bg-black/20"
                aria-hidden
              />
              <button
                type="button"
                className={cn(
                  "lc-focus-ring group absolute inset-0 flex items-center justify-center",
                  "text-white transition-[opacity,transform] duration-200",
                  "hover:opacity-[0.98] active:scale-[0.99] active:opacity-95",
                )}
                onClick={() => setPlaying(true)}
              >
                <span
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full md:size-16",
                    "border border-white/15 bg-black/45 backdrop-blur-md",
                    "shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
                    "transition-[border-color,background-color,transform] duration-200",
                    "group-hover:border-[color-mix(in_srgb,var(--mc-net-green)_55%,transparent)]",
                    "group-hover:bg-black/55 group-focus-visible:border-[var(--mc-net-green)]",
                  )}
                >
                  <Play
                    className="ml-0.5 size-7 text-[var(--mc-net-green)] md:size-8"
                    fill="currentColor"
                    strokeWidth={0}
                    aria-hidden
                  />
                </span>
                <span className="sr-only">Відтворити відео на YouTube</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
