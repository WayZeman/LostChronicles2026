"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroPromoVideoProps = {
  videoId: string;
};

function thumbUrlsFor(videoId: string) {
  return [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ] as const;
}

function buildYoutubeEmbedSrc(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
  });
  if (typeof window !== "undefined" && /^https?:\/\//.test(window.location.origin)) {
    params.set("origin", window.location.origin);
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function buildYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/** Прев’ю YouTube без iframe, поки користувач не натисне — економія трафіку на мобільних і 3G. */
export function HeroPromoVideo({ videoId }: HeroPromoVideoProps) {
  const [playing, setPlaying] = useState(false);
  const [thumbIndex, setThumbIndex] = useState(0);
  const thumbUrls = useMemo(() => Array.from(thumbUrlsFor(videoId)), [videoId]);

  useEffect(() => {
    setThumbIndex(0);
    setPlaying(false);
  }, [videoId]);

  return (
    <div className="w-full" aria-label="Відео про сервер Lost Chronicles на YouTube">
      <div
        className={cn(
          "overflow-hidden rounded-[1.75rem] border border-white/[0.14]",
          "bg-[color-mix(in_srgb,var(--mc-surface)_38%,transparent)]",
          "shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_16px_48px_rgba(0,0,0,0.26)]",
          "backdrop-blur-[36px] backdrop-saturate-[1.75]",
        )}
      >
        <div className="relative aspect-video w-full bg-black">
          {playing ? (
            <iframe
              src={buildYoutubeEmbedSrc(videoId)}
              className="absolute inset-0 h-full w-full border-0"
              title="Lost Chronicles — відео на YouTube"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <>
              <Image
                key={thumbUrls[thumbIndex]}
                src={thumbUrls[thumbIndex]}
                alt=""
                className="object-cover"
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                quality={92}
                loading="lazy"
                fetchPriority="low"
                onError={() => {
                  setThumbIndex((i) =>
                    i < thumbUrls.length - 1 ? i + 1 : i,
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
                    "border border-white/20 bg-[color-mix(in_srgb,#000_32%,transparent)] backdrop-blur-xl",
                    "shadow-[0_12px_40px_rgba(0,0,0,0.3)]",
                    "transition-[border-color,background-color,transform] duration-200",
                    "group-hover:border-[color-mix(in_srgb,var(--mc-net-green)_55%,transparent)]",
                    "group-hover:bg-[color-mix(in_srgb,#000_48%,transparent)] group-focus-visible:border-[var(--mc-net-green)]",
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
              <a
                href={buildYoutubeWatchUrl(videoId)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "lc-focus-ring absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-xs",
                  "border border-white/20 bg-black/45 text-white/90 backdrop-blur-md",
                  "transition-colors hover:border-[var(--mc-net-green)] hover:text-[var(--mc-net-green)]",
                )}
              >
                Відкрити на YouTube
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
