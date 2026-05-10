"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import {
  buildYoutubeEmbedSrc,
  buildYoutubeWatchUrl,
  youtubeThumbUrlsFor,
} from "@/lib/youtube-embed";
import { cn } from "@/lib/utils";

export type HeroPromoVideoProps = {
  videoId: string;
};

/** Прев’ю YouTube без iframe, поки користувач не натисне — економія трафіку на мобільних і 3G. */
export function HeroPromoVideo({ videoId }: HeroPromoVideoProps) {
  const [playing, setPlaying] = useState(false);
  const [thumbIndex, setThumbIndex] = useState(0);
  const [preloadReady, setPreloadReady] = useState(false);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const thumbUrls = useMemo(() => youtubeThumbUrlsFor(videoId), [videoId]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setThumbIndex(0);
    setPlaying(false);
    setPreloadReady(false);
    setIframeSrc(null);
  }, [videoId]);

  // Підвантажуємо iframe трохи наперед (коли блок майже в кадрі), щоб перший клік одразу стартував відео.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (typeof IntersectionObserver !== "function") {
      setPreloadReady(true);
      setIframeSrc(buildYoutubeEmbedSrc(videoId, { autoplay: false, mute: true }));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setPreloadReady(true);
        setIframeSrc(buildYoutubeEmbedSrc(videoId, { autoplay: false, mute: true }));
        io.disconnect();
      },
      { root: null, rootMargin: "600px 0px", threshold: 0.01 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [videoId]);

  return (
    <div
      ref={rootRef}
      className="w-full"
      aria-label="Відео про сервер Lost Chronicles на YouTube"
    >
      <div
        className={cn(
          "overflow-hidden rounded-[1.75rem] border border-white/[0.14]",
          "bg-[color-mix(in_srgb,var(--mc-surface)_38%,transparent)]",
          "shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_16px_48px_rgba(0,0,0,0.26)]",
          "backdrop-blur-[36px] backdrop-saturate-[1.75]",
        )}
      >
        <div className="relative aspect-video w-full bg-black">
          {iframeSrc ? (
            <iframe
              src={
                playing
                  ? buildYoutubeEmbedSrc(videoId, { autoplay: true, mute: false })
                  : iframeSrc
              }
              className={cn(
                "absolute inset-0 h-full w-full border-0",
                !playing && "pointer-events-none opacity-0",
              )}
              title="Lost Chronicles — відео на YouTube"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              aria-hidden={!playing}
              tabIndex={playing ? 0 : -1}
            />
          ) : null}

          {!playing ? (
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
                onClick={() => {
                  // Якщо iframe ще не встиг підвантажитися — стартуємо його одразу.
                  if (!preloadReady || !iframeSrc) {
                    setPreloadReady(true);
                    setIframeSrc(buildYoutubeEmbedSrc(videoId, { autoplay: false, mute: true }));
                  }
                  setPlaying(true);
                }}
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
