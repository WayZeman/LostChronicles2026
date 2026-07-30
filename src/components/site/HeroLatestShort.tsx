"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { buildYoutubeShortsUrl, youtubeThumbUrlsFor } from "@/lib/youtube-embed";
import { cn } from "@/lib/utils";

export type HeroLatestShortProps = {
  videoId: string;
  className?: string;
};

/** Прев’ю останнього Shorts — клік відкриває YouTube. */
export function HeroLatestShort({ videoId, className }: HeroLatestShortProps) {
  const [thumbIndex, setThumbIndex] = useState(0);
  const thumbUrls = useMemo(() => youtubeThumbUrlsFor(videoId), [videoId]);
  const href = buildYoutubeShortsUrl(videoId);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Дивитися на YouTube Lost Chronicles"
      className={cn(
        "lc-focus-ring group relative block h-full min-h-0 shrink-0 overflow-hidden",
        "bg-black",
        "transition-[transform] duration-200 active:scale-[0.99]",
        className,
      )}
    >
      <span className="relative block h-full w-full bg-black">
        <Image
          key={thumbUrls[thumbIndex]}
          src={thumbUrls[thumbIndex]}
          alt=""
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          fill
          sizes="208px"
          quality={75}
          loading="lazy"
          fetchPriority="low"
          onError={() => {
            setThumbIndex((i) => (i < thumbUrls.length - 1 ? i + 1 : i));
          }}
        />
        <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15" aria-hidden />
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-[var(--radius)]",
              "border-2 border-white/25 bg-black/55",
              "shadow-[0_10px_28px_rgba(0,0,0,0.35)]",
              "transition-[border-color,background-color,transform] duration-200",
              "group-hover:border-[color-mix(in_srgb,var(--mc-net-green)_55%,transparent)]",
              "group-hover:bg-[color-mix(in_srgb,#000_48%,transparent)] group-hover:scale-105",
            )}
          >
            <Play
              className="ml-0.5 size-6 text-[var(--mc-net-green)]"
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
          </span>
        </span>
      </span>
    </a>
  );
}
